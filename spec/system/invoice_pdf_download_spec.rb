# frozen_string_literal: true

require "rails_helper"

describe "Invoice PDF Download", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company: company) }
  let(:invoice) do
    create(:invoice,
      client: client,
      company: company,
      invoice_number: "INV-2024-001",
      amount: 1500.00,
      status: :sent
    )
  end

  before do
    create(:employment, user: user, company: company)
    user.add_role(:admin, company)
    create(:invoice_line_item,
      invoice: invoice,
      name: "Development Services",
      description: "Web development work",
      date: Date.current,
      quantity: 600,
      rate: 100
    )

    sign_in(user)
  end

  it "renders invoice detail for PDF download flow", js: true do
    visit "/invoices/#{invoice.id}"
    expect(page).to have_content(invoice.invoice_number)
    expect(page).to have_current_path(/\/invoices\/\d+/, wait: 10)
    expect(page).to have_content("Download", wait: 5)
  end

  it "shows a download action on invoice detail", js: true do
    visit "/invoices/#{invoice.id}"
    expect(page).to have_current_path(/\/invoices\/\d+/, wait: 10)

    download_action = page.has_button?("Download", wait: 5) ||
      page.has_button?("download", wait: 5) ||
      page.has_link?("Download", wait: 5) ||
      page.has_link?("download", wait: 5)

    if download_action
      expect(download_action).to eq(true)
    else
      find("#menuOpen", wait: 5).click
      expect(page).to have_css("li,button,a", text: /download/i, wait: 5)
    end
  end
end
