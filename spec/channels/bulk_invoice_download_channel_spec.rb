# frozen_string_literal: true

require "rails_helper"

RSpec.describe BulkInvoiceDownloadChannel, type: :channel do
  before do
    stub_connection
  end

  it "subscribes to a stream when room id is provided" do
    subscribe(download_id: 42)
    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_for("bulk_invoice_download_channel_42")
  end
end
