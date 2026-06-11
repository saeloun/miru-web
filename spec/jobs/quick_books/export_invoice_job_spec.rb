# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickBooks::ExportInvoiceJob, type: :job do
  it "exports the requested invoice for the active connection" do
    connection = create(:quickbooks_connection)
    invoice = create(:invoice, company: connection.company)
    exporter = instance_double(QuickBooks::Exporters::Invoice, export!: true)

    allow(QuickBooks::Exporters::Invoice).to receive(:new).and_return(exporter)

    described_class.perform_now(connection.id, invoice.id)

    expect(QuickBooks::Exporters::Invoice).to have_received(:new).with(
      connection: connection,
      source: :manual
    )
    expect(exporter).to have_received(:export!).with(invoice, trigger: :manual)
  end
end
