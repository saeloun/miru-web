# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe PayrollBankChangeNoticeJob do
  def committed(&block)
    Thread.new { ApplicationRecord.connection_pool.with_connection(&block) }.value
  end

  def fixture
    committed do
      company = create(:company)
      enable_synthetic_payroll(company.id)
      owner = create(:user)
      owner.add_role(:owner, company)
      create(:employment, company:, user: owner, joined_at: "2020-01-01", resigned_at: nil)
      employment = create(:employment, company:, resigned_at: nil)
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2020-01-01", monthly_fee: 50_000,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Entity", change_reason: "Configured")
      EmployeeRecord.create!(employment:, private_details: { "bank_name" => "PRIVATE BANK", "bank_account_name" => "PRIVATE HOLDER", "bank_account_number" => "123456789012" })
      PayrollBankChangeNotice.sole.id
    end
  end

  after do
    DatabaseCleaner.clean
    committed { DatabaseCleaner.clean_with(:truncation, except: %w[ar_internal_metadata schema_migrations]) }
  end

  it "queues only committed IDs and delivers once under competing jobs without private mail instrumentation" do
    payloads = []
    subscriber = ActiveSupport::Notifications.subscribe(/action_mailer/) { |event| payloads << event.payload }
    id = fixture
    jobs = enqueued_jobs.select { |job| job[:job] == described_class }
    expect(jobs.pluck(:args)).to eq([[id]])
    threads = 2.times.map { Thread.new { ApplicationRecord.connection_pool.with_connection { described_class.perform_now(id) } } }
    Timeout.timeout(10) { threads.each(&:value) }
    expect(committed { PayrollBankChangeNotice.find(id).state }).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    message = ActionMailer::Base.deliveries.last
    expect(message.body.decoded).to include("/payroll", "reverify", "original destination")
    url = URI.parse(message.body.decoded[/https?:\/\/\S+/])
    expect(url.host).to eq(URI.parse(PayrollBankChangeMailer.new.send(:root_url)).host)
    expect(url.path).to eq("/payroll")
    expect(url.query).to be_nil
    expect(message.message_id).to be_present
    expect(message.message_id).not_to include("payroll-bank-change-")
    expect(message.body.decoded).not_to include("PRIVATE", "123456789012")
    expect(payloads.to_json).not_to include("PRIVATE", "123456789012", message.to.first, "reverify")
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
    threads&.each { |thread| thread.kill if thread.alive? }
    threads&.each(&:join)
  end

  it "leaves disabled transport queued and can safely deliver when it is enabled" do
    id = fixture
    allow(PayrollBankChangeMailer).to receive(:perform_deliveries).and_return(false)
    committed { described_class.perform_now(id) }
    expect(committed { PayrollBankChangeNotice.find(id).state }).to eq("queued")
    expect(ActionMailer::Base.deliveries).to be_empty
    allow(PayrollBankChangeMailer).to receive(:perform_deliveries).and_return(true)
    committed { described_class.perform_now(id) }
    expect(committed { PayrollBankChangeNotice.find(id).state }).to eq("sent")
  end

  it "marks an attempted transport exception uncertain without leaking or automatically resending" do
    id = fixture
    output = StringIO.new
    allow(Rails).to receive(:logger).and_return(ActiveSupport::Logger.new(output))
    allow(PayrollBankChangeMailer).to receive(:changed).and_wrap_original do |original, *arguments|
      mail = original.call(*arguments)
      allow(mail.message.delivery_method).to receive(:deliver!).and_raise(StandardError, "PRIVATE bank 123456789012")
      mail
    end
    committed { described_class.perform_now(id) }
    expect(committed { PayrollBankChangeNotice.find(id).state }).to eq("uncertain")
    expect(output.string).not_to include("PRIVATE", "123456789012")
    committed { described_class.perform_now(id); PayrollBankChangeRecoveryJob.perform_now }
    expect(committed { PayrollBankChangeNotice.find(id).state }).to eq("uncertain")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "terminally skips disabled entitlement rather than sending later" do
    id = fixture
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    committed { described_class.perform_now(id) }
    expect(committed { PayrollBankChangeNotice.find(id).state }).to eq("skipped")
    enable_synthetic_payroll(committed { PayrollBankChangeNotice.find(id).company_id })
    committed { described_class.perform_now(id) }
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "rechecks recipient eligibility on delivery and does not overwrite an interrupted attempt as sent" do
    id = fixture
    committed do
      notice = PayrollBankChangeNotice.find(id)
      notice.recipient.remove_role(:owner, notice.company)
      described_class.perform_now(id)
    end
    expect(committed { PayrollBankChangeNotice.find(id).state }).to eq("skipped")
    expect(ActionMailer::Base.deliveries).to be_empty
    committed do
      notice = PayrollBankChangeNotice.find(id)
      notice.recipient.add_role(:owner, notice.company)
      notice.update!(state: "queued")
    end
    allow(PayrollBankChangeMailer).to receive(:changed).and_wrap_original do |original, *arguments|
      mail = original.call(*arguments)
      allow(mail.message.delivery_method).to receive(:deliver!).and_wrap_original do |deliver, *values|
        PayrollBankChangeNotice.find(id).update!(attempted_at: 16.minutes.ago)
        PayrollBankChangeRecoveryJob.perform_now
        deliver.call(*values)
      end
      mail
    end
    committed { described_class.perform_now(id) }
    expect(committed { PayrollBankChangeNotice.find(id).state }).to eq("uncertain")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    committed { described_class.perform_now(id) }
    expect(ActionMailer::Base.deliveries.size).to eq(1)
  end

  it "keeps a committed journal after enqueue failure and recovers queued and interrupted states separately" do
    allow(described_class).to receive(:perform_later).and_raise(StandardError, "PRIVATE queue failure")
    id = nil
    expect { id = fixture }.not_to raise_error
    expect(committed { PayrollBankChangeNotice.find(id).state }).to eq("queued")
    allow(described_class).to receive(:perform_later).and_call_original
    clear_enqueued_jobs
    committed { PayrollBankChangeRecoveryJob.perform_now }
    expect(enqueued_jobs).to be_empty
    committed { PayrollBankChangeNotice.find(id).update!(created_at: 16.minutes.ago) }
    allow(PayrollBankChangeMailer).to receive(:perform_deliveries).and_return(false)
    committed { PayrollBankChangeRecoveryJob.perform_now }
    expect(enqueued_jobs).to be_empty
    allow(PayrollBankChangeMailer).to receive(:perform_deliveries).and_return(true)
    committed { PayrollBankChangeRecoveryJob.perform_now }
    expect(enqueued_jobs.filter_map { |job| job[:args] if job[:job] == described_class }).to eq([[id]])
    committed { PayrollBankChangeNotice.find(id).update!(state: "sending", attempted_at: 16.minutes.ago) }
    clear_enqueued_jobs
    allow(PayrollBankChangeMailer).to receive(:perform_deliveries).and_return(false)
    committed { PayrollBankChangeRecoveryJob.perform_now }
    expect(committed { PayrollBankChangeNotice.find(id).state }).to eq("uncertain")
    expect(enqueued_jobs).to be_empty
    expect(ActionMailer::Base.deliveries).to be_empty
  end
end
