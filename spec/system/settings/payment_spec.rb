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

    it "shows localized payment settings copy in Hindi", :aggregate_failures do
      user.update!(locale: "hi")
      create(:stripe_connected_account, company:, account_id: "acct_connected_123")
      allow(Stripe::Account).to receive(:retrieve).and_return(
        OpenStruct.new(details_submitted: true)
      )

      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("भुगतान प्रदाता", wait: 10)
        expect(page).to have_content("फ़ीचर्स और लाभ", wait: 10)
        expect(page).to have_content("कनेक्टेड", wait: 10)

        click_on "डिस्कनेक्ट करें"

        expect(page).to have_content("Stripe खाता डिस्कनेक्ट करें", wait: 10)
        expect(page).to have_content(
          "क्या आप वाकई अपना Stripe खाता डिस्कनेक्ट करना चाहते हैं?",
          wait: 10
        )
      end
    end
  end

  describe "employee access" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      sign_in(employee)
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
