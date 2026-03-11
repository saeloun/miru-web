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

  describe "authorization" do
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let(:employee_headers) { auth_headers(employee) }
    let(:book_keeper) { create(:user, current_workspace_id: company.id) }
    let(:book_keeper_headers) { auth_headers(book_keeper) }
    let(:client) { create(:user, current_workspace_id: company.id) }
    let(:client_headers) { auth_headers(client) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role(:employee, company)
      create(:employment, company:, user: book_keeper)
      book_keeper.add_role(:book_keeper, company)
      client.add_role(:client, company)
    end

    it "blocks employees from billing summary and actions" do
      get "/api/v1/subscription", headers: employee_headers
      expect(response).to have_http_status(:forbidden)

      post "/api/v1/subscription/trial", headers: employee_headers
      expect(response).to have_http_status(:forbidden)

      post "/api/v1/subscription/checkout", headers: employee_headers
      expect(response).to have_http_status(:forbidden)

      post "/api/v1/subscription/portal", headers: employee_headers
      expect(response).to have_http_status(:forbidden)
    end

    it "blocks book keepers from billing summary and actions" do
      get "/api/v1/subscription", headers: book_keeper_headers
      expect(response).to have_http_status(:forbidden)

      post "/api/v1/subscription/trial", headers: book_keeper_headers
      expect(response).to have_http_status(:forbidden)

      post "/api/v1/subscription/checkout", headers: book_keeper_headers
      expect(response).to have_http_status(:forbidden)

      post "/api/v1/subscription/portal", headers: book_keeper_headers
      expect(response).to have_http_status(:forbidden)
    end

    it "blocks clients from billing summary and actions" do
      get "/api/v1/subscription", headers: client_headers
      expect(response).to have_http_status(:forbidden)

      post "/api/v1/subscription/trial", headers: client_headers
      expect(response).to have_http_status(:forbidden)

      post "/api/v1/subscription/checkout", headers: client_headers
      expect(response).to have_http_status(:forbidden)

      post "/api/v1/subscription/portal", headers: client_headers
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/subscription" do
    it "returns billing summary" do
      get "/api/v1/subscription", headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["plan_tier"]).to eq("free")
      expect(body["plan_label"]).to eq("free")
      expect(body["team_member_limit"]).to eq(3)
      expect(body["has_stripe_customer"]).to eq(false)
      expect(body["trial_active"]).to eq(false)
      expect(body["trial_available"]).to eq(true)
      expect(body["pro_access"]).to eq(false)
    end

    it "returns trial summary when the company is on a pro trial" do
      travel_to(Time.zone.local(2026, 3, 11, 12, 0, 0)) do
        company.update!(
          trial_started_at: Time.current,
          trial_ends_at: 30.days.from_now
        )

        get "/api/v1/subscription", headers: headers

        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body["plan_label"]).to eq("pro_trial")
        expect(body["subscription_status"]).to eq("trialing")
        expect(body["trial_active"]).to eq(true)
        expect(body["pro_access"]).to eq(true)
        expect(body["team_member_limit"]).to eq(100)
      end
    end

    it "returns paid summary for active subscriptions" do
      company.update!(
        plan_tier: "paid",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        subscription_status: "active",
        subscription_interval: "month",
        subscription_ends_at: Time.zone.local(2026, 4, 10, 12, 0, 0)
      )

      get "/api/v1/subscription", headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["plan_label"]).to eq("paid")
      expect(body["subscription_status"]).to eq("active")
      expect(body["subscription_interval"]).to eq("month")
      expect(body["has_stripe_customer"]).to eq(true)
      expect(body["pro_access"]).to eq(true)
      expect(body["trial_available"]).to eq(false)
    end
  end

  describe "POST /api/v1/subscription/trial" do
    it "starts a 30-day trial and returns the updated summary" do
      travel_to(Time.zone.local(2026, 3, 11, 12, 0, 0)) do
        expect do
          post "/api/v1/subscription/trial", headers: headers
        end.to have_enqueued_mail(SubscriptionMailer, :trial_started)

        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)

        expect(company.reload.trial_started_at).to eq(Time.current)
        expect(company.trial_ends_at).to eq(30.days.from_now)
        expect(body["plan_label"]).to eq("pro_trial")
        expect(body["subscription_status"]).to eq("trialing")
        expect(body["pro_access"]).to eq(true)
        expect(body["notice"]).to eq("Your 30-day Pro trial has started")
      end
    end

    it "returns 422 when the company already used its trial" do
      company.update!(
        trial_started_at: 45.days.ago,
        trial_ends_at: 15.days.ago
      )

      post "/api/v1/subscription/trial", headers: headers

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["errors"]).to eq("Your workspace is not eligible for a Pro trial")
    end
  end

  describe "POST /api/v1/subscription/checkout" do
    it "returns stripe plan page url when configured" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("STRIPE_PLAN_PAGE_URL").and_return("https://buy.stripe.com/test_plan")

      post "/api/v1/subscription/checkout", params: { interval: "yearly" }, headers: headers

      expect(response).to have_http_status(:ok)
      url = JSON.parse(response.body)["url"]
      expect(url).to include("https://buy.stripe.com/test_plan")
      expect(url).to include("prefilled_email=#{CGI.escape(user.email)}")
      expect(url).to include("client_reference_id=#{company.id}")
      expect(url).to include("billing_interval=yearly")
    end

    it "returns 422 when stripe price is not configured" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("STRIPE_PLAN_PAGE_URL").and_return(nil)
      allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY").and_return(nil)
      allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY").and_return(nil)
      allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID").and_return(nil)

      post "/api/v1/subscription/checkout", headers: headers

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "creates a monthly checkout session when configured" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("STRIPE_PLAN_PAGE_URL").and_return(nil)
      allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY").and_return("price_monthly")
      allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID").and_return(nil)

      stripe_customer = OpenStruct.new(id: "cus_123")
      stripe_session = OpenStruct.new(url: "https://checkout.stripe.com/test")

      allow(Stripe::Customer).to receive(:create).and_return(stripe_customer)
      allow(Stripe::Checkout::Session).to receive(:create).and_return(stripe_session)

      post "/api/v1/subscription/checkout", headers: headers

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["url"]).to eq("https://checkout.stripe.com/test")
      expect(company.reload.stripe_customer_id).to eq("cus_123")
      expect(Stripe::Checkout::Session).to have_received(:create).with(
        hash_including(
          line_items: [{ price: "price_monthly", quantity: 1 }],
          success_url: "http://www.example.com/settings/billing?billing=success",
          cancel_url: "http://www.example.com/settings/billing?billing=cancelled",
          metadata: hash_including(company_id: company.id, billing_interval: "monthly")
        )
      )
    end

    it "creates a yearly checkout session when configured" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("STRIPE_PLAN_PAGE_URL").and_return(nil)
      allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY").and_return("price_yearly")
      allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID").and_return(nil)

      stripe_customer = OpenStruct.new(id: "cus_456")
      stripe_session = OpenStruct.new(url: "https://checkout.stripe.com/yearly")

      allow(Stripe::Customer).to receive(:create).and_return(stripe_customer)
      allow(Stripe::Checkout::Session).to receive(:create).and_return(stripe_session)

      post "/api/v1/subscription/checkout", params: { interval: "yearly" }, headers: headers

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["url"]).to eq("https://checkout.stripe.com/yearly")
      expect(Stripe::Checkout::Session).to have_received(:create).with(
        hash_including(
          line_items: [{ price: "price_yearly", quantity: 1 }],
          success_url: "http://www.example.com/settings/billing?billing=success",
          cancel_url: "http://www.example.com/settings/billing?billing=cancelled",
          metadata: hash_including(company_id: company.id, billing_interval: "yearly")
        )
      )
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
      expect(Stripe::BillingPortal::Session).to have_received(:create).with(
        customer: "cus_123",
        return_url: "http://www.example.com/settings/billing"
      )
    end
  end
end
