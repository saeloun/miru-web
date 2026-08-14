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
    it "rejects checkout for an existing paid subscription" do
      allow(Stripe::Checkout::Session).to receive(:create)

      post "/api/v1/subscription/checkout", headers: headers

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["errors"]).to eq(
        "Your workspace already has an active paid subscription. Use Manage billing to make changes."
      )
      expect(Stripe::Checkout::Session).not_to have_received(:create)
    end
  end
end
