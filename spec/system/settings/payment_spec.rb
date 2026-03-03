# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings - Payment", type: :system, js: true do
  let(:company) { create(:company, name: "Payment Corp") }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "payment settings page" do
    it "admin can view payment settings" do
      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "shows payment provider configuration section" do
      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Stripe", wait: 10)
          .or have_content("Payment Providers", wait: 10)
          .or have_content("Payment Settings", wait: 10)
      end
    end

    it "admin has full access" do
      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_current_path("/settings/payment", wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
      end
    end
  end

  describe "employee access" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      Warden.test_reset!
      login_as(employee, scope: :user)
      visit "/"
      expect(page).to have_css("#react-root", wait: 10)
    end

    it "employee cannot access payment settings" do
      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_current_path("/settings/profile", wait: 10)
          .or have_no_content("Payment Providers", wait: 10)
      end
    end
  end
end
