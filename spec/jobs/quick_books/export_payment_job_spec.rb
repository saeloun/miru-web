# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickBooks::ExportPaymentJob, type: :job do
  it "exports the requested payment for the active connection" do
    connection = create(:quickbooks_connection)
    invoice = create(:invoice, company: connection.company)
    payment = create(:payment, invoice:)
    exporter = instance_double(QuickBooks::Exporters::Payment, export!: true)

    allow(QuickBooks::Exporters::Payment).to receive(:new).and_return(exporter)

    described_class.perform_now(connection.id, payment.id)

    expect(QuickBooks::Exporters::Payment).to have_received(:new).with(
      connection: connection,
      source: :manual
    )
    expect(exporter).to have_received(:export!).with(payment, trigger: :manual)
  end

  it "does not export discarded payments" do
    connection = create(:quickbooks_connection)
    invoice = create(:invoice, company: connection.company)
    payment = create(:payment, invoice:)

    payment.update_column(:discarded_at, Time.current)
    allow(QuickBooks::Exporters::Payment).to receive(:new)

    expect {
      described_class.perform_now(connection.id, payment.id)
    }.to raise_error(ActiveRecord::RecordNotFound)

    expect(QuickBooks::Exporters::Payment).not_to have_received(:new)
  end
end
