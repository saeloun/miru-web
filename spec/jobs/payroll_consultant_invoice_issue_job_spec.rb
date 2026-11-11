# frozen_string_literal: true

require "rails_helper"

RSpec.describe PayrollConsultantInvoiceIssueJob do
  include_context "committed consultant invoice"

  it "runs real issuance after credit commits and cannot roll credit back when rendering fails" do
    receipt = prepare_consultant_invoice
    grant_invoice_consent
    clear_enqueued_jobs
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render) do
      expect(ApplicationRecord.connection.transaction_open?).to be(false)
      raise "Synthetic renderer unavailable"
    end
    leg = nil
    perform_enqueued_jobs(only: described_class) { leg = credited_invoice_leg }
    expect(leg.payroll_payment_group.reload.fully_credited_at).to be_present
    expect(leg.reload.credited_minor).to eq(net_minor)
    expect(receipt.reload).to have_attributes(state: "failed", error_code: "render_unavailable")
    expect(PayrollConsultantInvoice.count).to eq(0)
  end
end
