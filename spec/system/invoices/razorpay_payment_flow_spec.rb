# frozen_string_literal: true

require "openssl"
require "rails_helper"

RSpec.describe "Invoice Razorpay payment flow", type: :system, js: true do
  let(:company) { create(:india_company, base_currency: "INR") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, currency: "INR", name: "Razorpay Client") }
  let(:invoice) do
    create(
      :invoice,
      company:,
      client:,
      currency: "INR",
      status: :sent,
      invoice_number: "INV-RZP-E2E-001",
      amount: 1000.00,
      amount_due: 1000.00,
      amount_paid: 0.00,
      outstanding_amount: 1000.00,
      payment_infos: {
        "razorpay_payment_link_id" => "plink_test_123",
        "razorpay_payment_link_url" => "https://rzp.io/rzp/test"
      }
    )
  end
  let!(:provider) do
    create(
      :payments_provider,
      company:,
      name: PaymentsProvider::RAZORPAY_PROVIDER,
      enabled: true,
      connected: true,
      settings: {
        key_id: "rzp_test_123",
        key_secret: "secret",
        webhook_secret: "webhook_secret",
        enabled_on_invoices: true
      }
    )
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
    allow(PaymentMailer).to receive_message_chain(:with, :payment, :deliver_later)
    allow_any_instance_of(Invoice).to receive(:send_to_client_email)
  end

  it "marks sent invoice paid via Razorpay webhook and shows the payment in UI" do
    with_forgery_protection do
      visit "/invoices/#{invoice.id}"
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("INV-RZP-E2E-001", wait: 10)
      expect(page).to have_content("Sent", wait: 10)

      payload = razorpay_paid_payload(invoice:)
      signature = OpenSSL::HMAC.hexdigest("SHA256", "webhook_secret", payload)

      result = InvoicePayment::RazorpayPaymentLinkWebhookFulfillment
        .new(payload:, signature:)
        .process

      expect(result).to be(true)

      visit "/invoices/#{invoice.id}"
      expect(page).to have_content("INV-RZP-E2E-001", wait: 10)
      expect(page).to have_content("Paid", wait: 10)

      visit "/payments"
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("INV-RZP-E2E-001", wait: 10)
      expect(page).to have_content("Razorpay", wait: 10)
      expect(page).to have_content("1,000", wait: 10)
    end
  end

  def razorpay_paid_payload(invoice:)
    {
      event: "payment_link.paid",
      created_at: Time.zone.local(2026, 4, 29, 12, 0, 0).to_i,
      payload: {
        payment_link: {
          entity: {
            id: "plink_test_123",
            amount_paid: 100_000,
            updated_at: Time.zone.local(2026, 4, 29, 12, 0, 0).to_i,
            reference_id: "miru-inv-#{invoice.id}",
            notes: {
              miru_invoice_id: invoice.id.to_s,
              company_id: company.id.to_s
            },
            customer: {
              name: "Razorpay Client"
            }
          }
        },
        payment: {
          entity: {
            id: "pay_test_123"
          }
        }
      }
    }.to_json
  end
end
