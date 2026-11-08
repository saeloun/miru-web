# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Confidential India payroll mail" do
  let(:report) do
    { "accounts_email" => "accounts@example.test", "consultant_name" => "Synthetic <Consultant>", "period" => "2026-11",
      "legal_entity" => "Synthetic India", "recorded_hours" => "160", "working_days" => "20",
      "leave_entries" => [{ "date" => "2026-11-03", "duration_minutes" => "480" }],
      "monthly_fee" => "62500", "confirmed_unpaid_hours" => "8", "revision_digest" => "synthetic-revision",
      "line" => { "extras" => [{ "reason" => "Approved <adjustment>", "amount_minor" => 1000 }],
        "deductions" => [{ "reason" => "Withholding", "amount_minor" => 500 }], "amounts" => { "net_minor" => 6251500, "reimbursements_minor" => 1000 } },
      "reimbursements" => [{ "label" => "Synthetic travel", "date" => "2026-11-05", "amount_minor" => 1000, "currency" => "INR", "claim_id" => 42 }],
      "bank_details" => { "bank_account_name" => "Synthetic Holder", "bank_name" => "Synthetic Bank",
        "bank_account_number" => "123456789012", "bank_ifsc" => "SYNT0000001" } }
  end

  let(:pto) do
    { "policy_id" => 7, "paid_hours" => "10.0 <script>PTO_PRIVATE_SENTINEL</script>",
      "opening_hours" => "40.0", "accrued_hours" => "16.0", "advance_hours" => "4.0",
      "deferred_hours" => "6.0", "closing_hours" => "30.0" }
  end

  before do
    handoff = double("handoff", id: 11, report:)
    attempt = double("attempt", id: 21, attempt_number: 1, payroll_india_handoff: handoff)
    allow(PayrollIndiaDelivery).to receive(:find).with(21).and_return(attempt)
  end

  it "renders the entire frozen report in plain text and escaped HTML with an attempt identity" do
    mail = PayrollIndiaMailer.report(21).message
    expect(mail.to).to eq(["accounts@example.test"])
    expect(mail.reply_to).to eq(Array(ApplicationMailer.default.fetch(:reply_to)))
    expect(mail.message_id).to eq("payroll-india-21@miru")
    expect(mail.text_part.body.decoded).to include("123456789012", "SYNT0000001", "Synthetic travel", "synthetic-revision", "INR 62,505.00", "INR 62,515.00", "Withholding", "2026-11-03 | 8.0", "Not classified in source records")
    expect(mail.html_part.body.decoded).to include("Synthetic &lt;Consultant&gt;", "Approved &lt;adjustment&gt;", "123456789012", "2026-11-05")
    expect(mail.html_part.body.decoded).not_to include("Synthetic <Consultant>")
    expect(mail.html_part.body.decoded).not_to include("source_snapshot", "bank_digest", "reason_code")
    File.write(ENV["INDIA_MAIL_PREVIEW_PATH"], mail.html_part.body.decoded) if ENV["INDIA_MAIL_PREVIEW_PATH"]
  end

  it "renders all six frozen PTO fields and escapes hostile PTO text in HTML" do
    report["pto"] = pto
    mail = PayrollIndiaMailer.report(21).message
    fields = { "Approved paid leave" => pto.fetch("paid_hours"), "Opening PTO hours" => "40.0",
               "Accrued PTO hours" => "16.0", "Advance PTO hours" => "4.0", "Deferred hours" => "6.0", "Closing PTO hours" => "30.0" }
    fields.each { |name, value| expect(mail.text_part.body.decoded).to include("#{name}: #{value}") }
    html = mail.html_part.body.decoded
    rows = Nokogiri::HTML(html).css("table").first.css("tr").to_h { |row| [row.at_css("th").text, row.at_css("td").text] }
    expect(rows).to include(fields)
    expect(html).to include("&lt;script&gt;PTO_PRIVATE_SENTINEL&lt;/script&gt;")
    expect(html).not_to include("<script>", "Not classified in source records")
  end

  it "keeps private content and transport exception text out of mail notifications and logs" do
    report["pto"] = pto
    notifications = []
    output = StringIO.new
    subscriber = ActiveSupport::Notifications.subscribe(/action_mailer/) { |event| notifications << event.payload }
    original_logger = ActionMailer::Base.logger
    ActionMailer::Base.logger = ActiveSupport::Logger.new(output)
    delivery = PayrollIndiaMailer.report(21)
    delivery.message.delivery_method(:test)
    delivery.message.perform_deliveries = true
    allow(delivery.message.delivery_method).to receive(:deliver!).and_raise(StandardError, "PRIVATE accounts@example.test 123456789012")
    expect { delivery.deliver_now }.to raise_error(StandardError)
    expect(notifications).not_to be_empty
    expect(notifications.to_json + output.string).not_to include("accounts@example.test", "123456789012", "Synthetic Holder", "PRIVATE", "PTO_PRIVATE_SENTINEL")
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
    ActionMailer::Base.logger = original_logger
  end

  it "filters the entire private action payload and delivery evidence from request logs" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    filtered = filter.filter("india_handoff" => { "reference" => "PRIVATE transfer", "amount" => "62500" },
      "accounts_email" => "accounts@example.test", "evidence_reference" => "PRIVATE reconciliation")
    expect(filtered.values).to all(eq("[FILTERED]"))
  end
end
