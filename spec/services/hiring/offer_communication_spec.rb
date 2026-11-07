# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Approved offer email delivery" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end
  include_context "issued offer records"

  before do
    ActionMailer::Base.deliveries.clear
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
      end
    end
  end

  def queue_offer(record, actor: admin)
    communication = Hiring::OfferCommunication.new(offer: record, actor:)
    preview = communication.preview!(kind: "offer", mailbox_id: mailbox.id)
    communication.queue!(attributes: preview.fetch("intent")).first
  end

  it "delivers the frozen approved wording and private fragment link once without salary or internal material" do
    record = issued_offer_record
    approve_offer_messages
    message = queue_offer(record)
    2.times { HiringDeliveryJob.perform_now(message.id) }
    expect(message.reload.state).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    mail = ActionMailer::Base.deliveries.sole
    expect(mail.to).to eq(["candidate@example.test"])
    expect(mail.body.decoded).to include("Please review your private offer", candidate_name, "/hiring-offer##{record.access_token}")
    expect(mail.body.decoded).not_to include("125000.50", "PRIVATE", "recommendation")
    expect(record.reload.state).to eq("sent")
    expect(application.reload.stage).to eq("offer")
  end

  %w[expired revoked accepted declined selection_changed withdrawn recipient_changed approval_changed inbox_disabled link_changed].each do |change|
    it "blocks unsent email after #{change}" do
      record = issued_offer_record
      approve_offer_messages
      message = queue_offer(record)
      case change
      when "expired"
        travel_to(record.expires_at + 1.second)
      when "revoked"
        Hiring::Offers.new(application:, actor: admin).revoke!(offer: record, attributes: { "company_id" => company.id,
          "application_version" => application.reload.lock_version, "offer_version" => record.reload.lock_version })
      when "accepted", "declined"
        record.with_lock { record.reply!("offer_version" => record.lock_version, "outcome" => change) }
      when "selection_changed"
        Hiring::Decisions.new(application:, actor: admin).create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
          "request_key" => SecureRandom.uuid, "outcome" => "hold", "reason" => "New private review", "owner_employment_id" => nil, "follow_up_on" => nil })
      when "withdrawn"
        application.reload.update!(stage: "withdrawn")
      when "recipient_changed"
        application.hiring_candidate.update!(email: "changed@example.test")
      when "approval_changed"
        configuration = Hiring::Configure.new(company:, actor: admin)
        setting = company.hiring_setting.reload
        setting = configuration.save_draft!(details: setting.details.merge("offer_body" => "Different approved offer text"), lock_version: setting.lock_version)
        configuration.approve!(lock_version: setting.lock_version)
      when "inbox_disabled"
        mailbox.update!(active: false)
      when "link_changed"
        allow(Rails.application.config.action_mailer).to receive(:default_url_options).and_return({ host: "different.example.test" })
      end
      HiringDeliveryJob.perform_now(message.id)
      expect(message.reload.state).to eq("failed")
      expect(ActionMailer::Base.deliveries).to be_empty
    end
  end

  def other_admin
    user = create(:user, current_workspace: company)
    create(:employment, company:, user:, resigned_at: nil)
    user.add_role(:admin, company)
    user
  end

  it "rechecks queue-actor authority separately from the template approver" do
    record = issued_offer_record
    approver = other_admin
    approve_offer_messages(actor: approver)
    message = queue_offer(record)
    admin.remove_role(:admin, company)
    expect(company.hiring_setting.reload).to be_approved
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload).to have_attributes(state: "failed", error_code: "permission_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "lets a current Admin email issued company terms after the original issuer leaves the role" do
    record = issued_offer_record
    current_admin = other_admin
    approve_offer_messages(actor: current_admin)
    admin.remove_role(:admin, company)
    message = queue_offer(record, actor: current_admin)
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.state).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
  end

  it "blocks email if the candidate accepts after message construction but before transport" do
    record = issued_offer_record
    approve_offer_messages
    message = queue_offer(record)
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
        record.with_lock { record.reply!("offer_version" => record.lock_version, "outcome" => "accepted") }
      end
    end
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload).to have_attributes(state: "failed", error_code: "offer_unavailable")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "keeps transport uncertainty for explicit review without automatic resend" do
    record = issued_offer_record
    approve_offer_messages
    message = queue_offer(record)
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
        allow(mail).to receive(:deliver_now).and_raise(IOError, "Synthetic unknown transport outcome")
      end
    end
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload).to have_attributes(state: "uncertain", error_code: "transport_unknown")
    2.times { HiringDeliveryRecoveryJob.perform_now }
    expect(HiringMessage.count).to eq(1)
    expect(ActionMailer::Base.deliveries).to be_empty
  end
end
