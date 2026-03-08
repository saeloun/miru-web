# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Responsive pages", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :owner, company
    sign_in(user)
  end

  it "renders core app routes in mobile viewport" do
    with_forgery_protection do
      page.current_window.resize_to(390, 844)

      [
        "/dashboard",
        "/time-tracking",
        "/clients",
        "/projects",
        "/team",
        "/invoices",
        "/payments",
        "/reports",
        "/expenses",
        "/settings/profile",
        "/settings/organization",
        "/settings/payment",
        "/settings/billing"
      ].each do |path|
        visit path
        expect(page).to have_current_path(path, wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).not_to have_content("Something went wrong")
      end
    end
  end
end
