# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice editor preview", type: :system, js: true do
  let(:company) { create(:company, name: "Wayne Enterprises", base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Gotham City Council") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "renders line item quantities in hours and keeps the preview totals hour-based" do
    invoice = create(:invoice,
      company:,
      client:,
      status: :draft,
      invoice_number: "INV-2024-900",
      amount: 1500.00,
      amount_due: 1500.00,
      issue_date: Date.new(2024, 1, 15),
      due_date: Date.new(2024, 2, 15))

    create(:invoice_line_item,
      invoice:,
      name: "Backend Development",
      description: "API integration work",
      rate: 100.00,
      quantity: 900,
      date: Date.new(2024, 1, 10))

    with_forgery_protection do
      visit "/invoices/#{invoice.id}/edit"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Description", wait: 10)
      expect(page).not_to have_text("undefined undefined", wait: 1)
      expect(page).to have_text("15:00", wait: 10)
      expect(page).to have_text("$1,500.00", wait: 10)
      expect(page).not_to have_text("$90,000.00", wait: 1)
      expect(page).not_to have_text("$0.00", wait: 1)
    end
  end
end
