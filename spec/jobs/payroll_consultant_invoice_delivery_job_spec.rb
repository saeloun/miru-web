# frozen_string_literal: true

require "rails_helper"

RSpec.describe PayrollConsultantInvoiceDeliveryJob do
  include_context "committed consultant invoice"

  it "sends one frozen attachment when another worker receives the same active attempt" do
    bytes = File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf"))
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_return(bytes)
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    id = invoice.payroll_consultant_invoice_deliveries.sole.id
    entered, resume = Queue.new, Queue.new
    allow(PayrollConsultantInvoiceMailer).to receive(:invoice).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        allow(mail).to receive(:deliver_now).and_wrap_original do |send_mail|
          entered << true
          Timeout.timeout(5) { resume.pop }
          send_mail.call
        end
      end
    end
    thread = Thread.new { ActiveRecord::Base.connection_pool.with_connection { described_class.perform_now(id) } }
    Timeout.timeout(5) do
      entered.pop
      described_class.perform_now(id)
      resume << true
      thread.value
    end
    expect(PayrollConsultantInvoiceDelivery.find(id).state).to eq("sent")
    expect(ActionMailer::Base.deliveries.sole.attachments.sole.decoded).to eq(bytes)
  ensure
    resume << true if resume
    thread&.join(5)
  end
end
