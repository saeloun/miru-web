# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Root#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  # Now conditional routing is handled from fromtend.

  context "when unauthenticated" do
    it "wont throw any error as it acts a root controller" do
      send_request :get, root_path
      expect(response).to be_successful
    end

    it "returns health JSON for JSON format requests" do
      send_request :get, root_path, headers: { "Accept" => "application/json" }
      expect(response).to have_http_status(:ok)
      expect(json_response).to eq({ "status" => "ok", "authenticated" => false })
    end

    it "returns health XML for XML format requests" do
      send_request :get, root_path, headers: { "Accept" => "application/xml" }

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("application/xml")
      expect(response.body).to include("<status>ok</status>")
    end

    it "returns markdown for agent content negotiation requests" do
      send_request :get, root_path, headers: { "Accept" => "text/markdown" }

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("text/markdown")
      expect(response.body).to include("# Miru App")
      expect(response.body).to include("OpenAPI:")
    end

    it "adds agent discovery headers to the homepage" do
      send_request :get, root_path

      expect(response.headers["Link"]).to include('/.well-known/api-catalog>; rel="api-catalog"')
      expect(response.headers["Link"]).to include('/openapi.json>; rel="service-desc"')
      expect(response.headers["Content-Signal"]).to eq("ai-train=yes, search=yes, ai-input=yes")
      expect(response.headers["Vary"]).to include("Accept")
    end

    it "returns not found for .well-known paths" do
      send_request :get, "/.well-known/assetlinks.json"
      expect(response).to have_http_status(:not_found)
    end
  end
end
