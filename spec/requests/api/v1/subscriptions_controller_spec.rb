# frozen_string_literal: true

require "rails_helper"
require "cgi"

RSpec.describe Api::V1::SubscriptionsController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:headers) { auth_headers(user) }

  before do
    create(:employment, company:, user:)
    user.add_role(:owner, company)
  end

  describe "GET /api/v1/subscription" do
    it "returns billing summary" do
      get "/api/v1/subscription", headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["plan_tier"]).to eq("free")
      expect(body["team_member_limit"]).to eq(3)
      expect(body["has_stripe_customer"]).to eq(false)
    end
  end

  describe "POST /api/v1/subscription/checkout" do
    it "returns stripe plan page url when configured" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("STRIPE_PLAN_PAGE_URL").and_return("https://buy.stripe.com/test_plan")

      post "/api/v1/subscription/checkout", headers: headers

      expect(response).to have_http_status(:ok)
      url = JSON.parse(response.body)["url"]
      expect(url).to include("https://buy.stripe.com/test_plan")
      expect(url).to include("prefilled_email=#{CGI.escape(user.email)}")
      expect(url).to include("client_reference_id=#{company.id}")
    end

    it "returns 422 when stripe price is not configured" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("STRIPE_PLAN_PAGE_URL").and_return(nil)
      allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID").and_return(nil)

      post "/api/v1/subscription/checkout", headers: headers

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "creates checkout session when configured" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("STRIPE_PLAN_PAGE_URL").and_return(nil)
      allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID").and_return("price_test")

      stripe_customer = OpenStruct.new(id: "cus_123")
      stripe_session = OpenStruct.new(url: "https://checkout.stripe.com/test")

      allow(Stripe::Customer).to receive(:create).and_return(stripe_customer)
      allow(Stripe::Checkout::Session).to receive(:create).and_return(stripe_session)

      post "/api/v1/subscription/checkout", headers: headers

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["url"]).to eq("https://checkout.stripe.com/test")
      expect(company.reload.stripe_customer_id).to eq("cus_123")
    end
  end

  describe "POST /api/v1/subscription/portal" do
    it "returns 422 when customer does not exist" do
      post "/api/v1/subscription/portal", headers: headers

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "returns billing portal url when customer exists" do
      company.update!(stripe_customer_id: "cus_123")
      stripe_portal = OpenStruct.new(url: "https://billing.stripe.com/session")
      allow(Stripe::BillingPortal::Session).to receive(:create).and_return(stripe_portal)

      post "/api/v1/subscription/portal", headers: headers

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["url"]).to eq("https://billing.stripe.com/session")
    end
  end
end
