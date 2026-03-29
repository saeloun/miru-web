# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::BaseController, type: :controller do
  controller(Api::V1::BaseController) do
    def index
      skip_authorization
      render json: { allowed: @virtual_verified_invitations_allowed }
    end
  end

  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, email: "admin@example.com") }

  before do
    create(:employment, company:, user:)
    sign_in user
  end

  describe "#set_virtual_verified_invitations_allowed" do
    context "when user email exactly matches an allowed email" do
      before do
        allow(ENV).to receive(:fetch).with("VIRTUAL_VERIFIED_ADMIN_EMAILS", "").and_return("admin@example.com")
      end

      it "sets @virtual_verified_invitations_allowed to true" do
        get :index
        expect(JSON.parse(response.body)["allowed"]).to be true
      end
    end

    context "when user email is a substring of an allowed email but not exact match" do
      before do
        allow(ENV).to receive(:fetch).with("VIRTUAL_VERIFIED_ADMIN_EMAILS", "").and_return("superadmin@example.com")
      end

      it "sets @virtual_verified_invitations_allowed to false" do
        get :index
        expect(JSON.parse(response.body)["allowed"]).to be false
      end
    end

    context "when allowed emails list is empty" do
      before do
        allow(ENV).to receive(:fetch).with("VIRTUAL_VERIFIED_ADMIN_EMAILS", "").and_return("")
      end

      it "sets @virtual_verified_invitations_allowed to false" do
        get :index
        expect(JSON.parse(response.body)["allowed"]).to be false
      end
    end

    context "when user email matches one of multiple allowed emails" do
      before do
        allow(ENV).to receive(:fetch).with("VIRTUAL_VERIFIED_ADMIN_EMAILS", "").and_return("other@example.com, admin@example.com, third@example.com")
      end

      it "sets @virtual_verified_invitations_allowed to true" do
        get :index
        expect(JSON.parse(response.body)["allowed"]).to be true
      end
    end

    context "when allowed emails have extra whitespace" do
      before do
        allow(ENV).to receive(:fetch).with("VIRTUAL_VERIFIED_ADMIN_EMAILS", "").and_return("  admin@example.com  , other@example.com  ")
      end

      it "strips whitespace and matches correctly" do
        get :index
        expect(JSON.parse(response.body)["allowed"]).to be true
      end
    end
  end

  describe "#not_found" do
    controller(Api::V1::BaseController) do
      def not_found_action
        not_found
      end
    end

    before do
      routes.draw { get "not_found_action" => "api/v1/base#not_found_action" }
    end

    it "returns symbolic :not_found status" do
      get :not_found_action
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)["error"]).to eq("Route not found")
    end
  end
end
