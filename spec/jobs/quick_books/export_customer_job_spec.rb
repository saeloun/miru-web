# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickBooks::ExportCustomerJob, type: :job do
  it "exports the requested client for the active connection" do
    connection = create(:quickbooks_connection)
    client = create(:client, company: connection.company)
    exporter = instance_double(QuickBooks::Exporters::Customer, export!: true)

    allow(QuickBooks::Exporters::Customer).to receive(:new).and_return(exporter)

    described_class.perform_now(connection.id, client.id)

    expect(QuickBooks::Exporters::Customer).to have_received(:new).with(
      connection: connection,
      source: :manual
    )
    expect(exporter).to have_received(:export!).with(client, trigger: :manual)
  end
end
