# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::SubscriptionsController, type: :request do
  let(:company) { create(:company, plan_tier: "paid") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:headers) { auth_headers(user) }

  before do
    create(:employment, company:, user:)
    user.add_role(:owner, company)
  end

  describe "POST /api/v1/subscription/checkout" do
    it "does not charge again while the paid subscription has not reached the local projection" do
      company.update!(plan_tier: "free", stripe_customer_id: "cus_existing")
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("STRIPE_PLAN_PAGE_URL").and_return(nil)
      allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY").and_return("price_monthly")
      subscription = Stripe::Subscription.construct_from(
        id: "sub_existing", customer: "cus_existing", status: "active", created: 1,
        current_period_end: 1.month.from_now.to_i, items: { data: [] }
      )
      allow(Stripe::Subscription).to receive(:list).and_return(
        Stripe::ListObject.construct_from(data: [subscription], has_more: false)
      )
      allow(Stripe::Checkout::Session).to receive(:create).and_return(OpenStruct.new(url: "https://checkout.stripe.com/duplicate"))

      post "/api/v1/subscription/checkout", headers: headers

      expect(response).to have_http_status(:unprocessable_content)
      expect(Stripe::Checkout::Session).not_to have_received(:create)
      expect(company.reload.plan_tier).to eq("paid")
    end

    it "rejects checkout for an existing paid subscription" do
      allow(Stripe::Checkout::Session).to receive(:create)

      post "/api/v1/subscription/checkout", headers: headers

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["errors"]).to eq(
        "Your workspace already has an active paid subscription. Use Manage billing to make changes."
      )
      expect(Stripe::Checkout::Session).not_to have_received(:create)
    end

    it "recovers Pro from Stripe on the existing billing summary poll" do
      company.update!(plan_tier: "free", stripe_customer_id: "cus_existing")
      subscription = Stripe::Subscription.construct_from(
        id: "sub_existing", customer: "cus_existing", status: "active", created: 1,
        current_period_end: 1.month.from_now.to_i, items: { data: [] }
      )
      allow(Stripe::Subscription).to receive(:list).and_return(
        Stripe::ListObject.construct_from(data: [subscription], has_more: false)
      )

      get "/api/v1/subscription", headers: headers

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to include("pro_access" => true, "plan_tier" => "paid")
    end
  end
end
