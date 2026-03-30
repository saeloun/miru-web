# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users::Sessions#me", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, locale: "hi", current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :owner, company
  end

  it "returns the authenticated user locale" do
    send_request :get, api_v1_users_me_path, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("user", "locale")).to eq("hi")
  end
end
