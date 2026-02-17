# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Company organization settings", type: :system, js: true do
  let(:company) { create(:company, name: "Stark Industries", base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  context "when admin views organization settings" do
    it "loads the organization settings page" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "displays the company name" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Stark Industries", wait: 10)
      end
    end
  end

  context "when admin accesses payment settings" do
    it "loads the payment settings page" do
      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end
  end

  context "when employee tries to access organization settings" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      Warden.test_reset!
      sign_in(employee)
    end

    it "does not show organization settings content" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).not_to have_content("Organization Settings", wait: 5)
      end
    end

    it "can still access personal profile" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Personal Details", wait: 10)
      end
    end
  end
end
