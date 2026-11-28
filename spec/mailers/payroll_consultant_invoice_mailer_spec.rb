# frozen_string_literal: true

require "rails_helper"

RSpec.describe PayrollConsultantInvoiceMailer do
  include_context "committed consultant invoice"
  let(:original_bytes) { File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")) }
  let(:paid_bytes) { original_bytes + "\n% Synthetic paid-settlement fixture\n" }
  before { allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_return(paid_bytes) }

  def issue_for_mail(existing: false)
    facts = invoice_facts
    if existing
      file = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
      upload = ActionDispatch::Http::UploadedFile.new(tempfile: file.tempfile, filename: "original.pdf", type: "application/pdf")
      facts = facts.merge("mode" => "existing", "timing" => "existing_invoice", "original_date" => "2026-11-30", "series" => "INTERNAL", "number" => "INV-2026-0042")
    end
    prepare_consultant_invoice(facts:, original_pdf: upload)
    grant_invoice_consent unless existing
    credited_invoice_leg
    Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
  ensure
    upload&.close
  end

  it "attaches the exact generated PDF and uses its confirmed frozen recipient after an alias change" do
    invoice = issue_for_mail
    expected = invoice.snapshot.fetch("accounts_email")
    stub_const("Payroll::ConsultantInvoicePreparation::ACCOUNTS_EMAIL", "changed@example.test")
    message = described_class.invoice(invoice.payroll_consultant_invoice_deliveries.sole.id).message
    expect(message.to).to eq([expected])
    expect(message.attachments.sole.decoded).to eq(paid_bytes)
    expect(message.text_part.body.decoded).to include("SYN/1", "2026-2027")
  end

  it "attaches the unchanged original and a separate hash-bound paid settlement PDF" do
    invoice = issue_for_mail(existing: true)
    message = described_class.invoice(invoice.payroll_consultant_invoice_deliveries.sole.id).message
    expect(message.attachments.size).to eq(2)
    expect(message.attachments["consultant-#{invoice.id}-original.pdf"].decoded).to eq(original_bytes)
    expect(message.attachments["consultant-#{invoice.id}-paid.pdf"].decoded).to eq(paid_bytes)
    expect(message.html_part.body.decoded).to include("Original invoice and paid settlement statement")
    expect(message.text_part.body.decoded).to include("Invoice: INV-2026-0042")
    expect(message.text_part.body.decoded).not_to include("INTERNAL/INV-2026-0042")
    expect(message.subject).to eq("Consultant paid invoice INV-2026-0042")
  end

  it "does not expose PDF content or private transport errors in notifications and logs" do
    invoice = issue_for_mail
    output = StringIO.new
    events = []
    subscriber = ActiveSupport::Notifications.subscribe(/action_mailer/) { |event| events << event.payload }
    previous = ActionMailer::Base.logger
    ActionMailer::Base.logger = ActiveSupport::Logger.new(output)
    mail = described_class.invoice(invoice.payroll_consultant_invoice_deliveries.sole.id)
    mail.message.delivery_method(:test)
    mail.message.perform_deliveries = true
    allow(mail.message.delivery_method).to receive(:deliver!).and_raise(IOError, "SYNTHETIC_PRIVATE_TRANSPORT_SENTINEL")
    expect { mail.deliver_now }.to raise_error(IOError)
    expect(output.string + events.inspect).not_to include("SYNTHETIC_PRIVATE_TRANSPORT_SENTINEL", paid_bytes)
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
    ActionMailer::Base.logger = previous
  end
end
