# frozen_string_literal: true

require "rails_helper"

RSpec.describe PdfGeneration::InvoiceService, "client legal name" do
  let(:company) { create(:company) }
  let(:client) do
    create(:client, company:, name: "QA display alias", legal_name: "Example International & Consulting Private Limited")
  end
  let(:invoice) { create(:invoice, company:, client:) }

  it "renders the legal billed-to name in the actual invoice template" do
    html = described_class.new(invoice).html_content
    expect(Capybara.string(html).find(".client-name").text).to eq(client.legal_name)
    expect(html).to include("Example International &amp; Consulting Private Limited")
  end

  it "preserves the display-name fallback for existing clients" do
    client.update!(legal_name: " ")
    html = described_class.new(invoice).html_content
    expect(Capybara.string(html).find(".client-name").text).to eq(client.name)
  end
end
