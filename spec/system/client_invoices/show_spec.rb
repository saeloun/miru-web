# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client invoice detail", type: :system, js: true do
  let(:company) { create(:company) }
  let(:client_user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Client Portal Co") }
  let!(:client_member) { create(:client_member, company:, client:, user: client_user) }
  let!(:employment) { create(:employment, company:, user: client_user) }
  let!(:invoice) do
    create(
      :invoice,
      company:,
      client:,
      invoice_number: "CLIENT-001",
      status: "sent"
    )
  end

  before do
    client_user.add_role :client, company
    sign_in(client_user)
  end

  it "lets the client open invoice detail from the invoice list" do
    with_forgery_protection do
      visit "/invoices"

      click_link "View invoice #{invoice.invoice_number}"

      expect(page).to have_current_path("/invoices/#{invoice.external_view_key}", wait: 10)
      expect(page).to have_content("Invoice ##{invoice.invoice_number}", wait: 10)
      expect(page).to have_content(client.name, wait: 10)
    end
  end
end
