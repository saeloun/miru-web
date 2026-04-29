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

    it "shows configured UPI QR branding and invoice controls" do
      create(
        :payments_provider,
        company:,
        name: PaymentsProvider::UPI_PROVIDER,
        enabled: true,
        connected: true,
        settings: {
          upi_id: "saeloun@upi",
          payee_name: "Saeloun",
          enabled_on_invoices: true
        }
      )

      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Free UPI QR", wait: 10)
        expect(page).to have_field("upi_id", with: "saeloun@upi")
        expect(page).to have_css("img[alt='Miru']")
        expect(page).to have_css("img[alt='UPI QR code']")
        expect(page).to have_content("Copy UPI ID")
        expect(page).to have_content("Copy payment link")
      end
    end

    it "shows the Razorpay launch checklist and webhook setup" do
      provider = build(
        :payments_provider,
        company:,
        name: PaymentsProvider::RAZORPAY_PROVIDER,
        enabled: true,
        connected: true,
        settings: {
          key_id: "rzp_test_123",
          enabled_on_invoices: true,
          linked_account_id: "acc_test_123",
          platform_fee_percent: "5",
          route_transfers_enabled: true,
          payouts_enabled: true,
          payout_account_number: "7878780080316316",
          payout_upi_id: "vendor@upi",
          payout_purpose: "payout",
          payout_queue_if_low_balance: true
        }
      )
      provider.key_secret = "secret"
      provider.webhook_secret = "webhook_secret"
      provider.save!

      with_forgery_protection do
        visit "/settings/payment?provider=razorpay"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Razorpay launch checklist", wait: 10)
        expect(page).to have_content("4/4 ready")
        expect(page).to have_content("Payment Link events")
        expect(page).to have_content("/webhooks/razorpay/payment_links")
        expect(page).to have_content("/webhooks/razorpay/payouts")
        expect(page).to have_content("payment_link.paid")
        expect(page).to have_content("payout.updated")
        expect(page).to have_field("razorpay_key_id", with: "rzp_test_123")
        expect(page).to have_field("razorpay_payout_upi", with: "vendor@upi")
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
