# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Calendars", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
    sign_in user
  end

  it "issues and validates OAuth state" do
    allow_any_instance_of(Signet::OAuth2::Client)
      .to receive(:fetch_access_token!)
      .and_return("access_token" => "token")

    get "/api/v1/calendars/redirect", headers: auth_headers(user)
    state = Rack::Utils.parse_query(URI.parse(json_response["url"]).query)["state"]

    expect(state).to be_present

    get "/api/v1/calendars/callback",
      params: { code: "authorization-code", state: },
      headers: auth_headers(user)

    expect(response).to redirect_to(api_v1_calendars_path)
  end

  it "rejects a callback with invalid state before token exchange" do
    expect_any_instance_of(Signet::OAuth2::Client).not_to receive(:fetch_access_token!)

    get "/api/v1/calendars/redirect", headers: auth_headers(user)
    get "/api/v1/calendars/callback",
      params: { code: "authorization-code", state: "wrong-state" },
      headers: auth_headers(user)

    expect(response).to redirect_to(root_path)
  end
end
