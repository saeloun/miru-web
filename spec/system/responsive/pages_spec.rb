# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Responsive pages", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:invoice) { create(:invoice, company:, client:) }
  let(:owner_routes) do
    [
      "/dashboard",
      "/time-tracking",
      "/clients",
      "/projects",
      "/team",
      "/invoices",
      "/invoices/new",
      "/invoices/#{invoice.id}",
      "/payments",
      "/reports",
      "/reports/revenue-by-client",
      "/reports/outstanding-overdue-invoices",
      "/reports/accounts-aging",
      "/reports/time-entry",
      "/reports/total-hours",
      "/reports/payments",
      "/expenses",
      "/settings/profile",
      "/settings/employment",
      "/settings/devices",
      "/settings/notifications",
      "/settings/organization",
      "/settings/payment",
      "/settings/leaves",
      "/settings/holidays",
      "/settings/billing"
    ]
  end

  before do
    create(:employment, company:, user:)
    user.add_role :owner, company
    sign_in(user)
  end

  it "renders owner routes in mobile viewport" do
    with_forgery_protection do
      page.current_window.resize_to(390, 844)

      owner_routes.each do |path|
        visit path
        expect(page).to have_current_path(path, wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_css('button[aria-label="Open menu"]', visible: true)
        expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
        expect(page).not_to have_content("Something went wrong")
      end
    end
  end

  it "renders owner routes in tablet viewport" do
    with_forgery_protection do
      page.current_window.resize_to(768, 1024)

      owner_routes.each do |path|
        visit path
        expect(page).to have_current_path(path, wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).not_to have_content("Something went wrong")
      end
    end
  end
end
