# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Mission Control authentication", type: :request do
  let(:headers) do
    {
      "HTTP_AUTHORIZATION" => ActionController::HttpAuthentication::Basic.encode_credentials("admin", "password")
    }
  end

  around do |example|
    original_username = ENV["SOLID_QUEUE_USERNAME"]
    original_password = ENV["SOLID_QUEUE_PASSWORD"]
    original_engine_auth = MissionControl::Jobs.http_basic_auth_enabled
    ENV["SOLID_QUEUE_USERNAME"] = "admin"
    ENV["SOLID_QUEUE_PASSWORD"] = "password"
    MissionControl::Jobs.http_basic_auth_enabled = false
    example.run
    ENV["SOLID_QUEUE_USERNAME"] = original_username
    ENV["SOLID_QUEUE_PASSWORD"] = original_password
    MissionControl::Jobs.http_basic_auth_enabled = original_engine_auth
  end

  before do
    allow_any_instance_of(ApplicationController).to receive(:authenticate_user!).and_return(true)
  end

  it "requires credentials" do
    get "/jobs"

    expect(response).to have_http_status(:unauthorized)
  end

  it "rejects incorrect credentials" do
    wrong_headers = {
      "HTTP_AUTHORIZATION" => ActionController::HttpAuthentication::Basic.encode_credentials("admin", "wrong")
    }

    get "/jobs", headers: wrong_headers

    expect(response).to have_http_status(:unauthorized)
  end

  it "fails closed when the username is unset" do
    ENV["SOLID_QUEUE_USERNAME"] = nil

    get "/jobs", headers: headers

    expect(response).to have_http_status(:unauthorized)
  end

  it "fails closed when the password is blank" do
    ENV["SOLID_QUEUE_PASSWORD"] = ""

    get "/jobs", headers: headers

    expect(response).to have_http_status(:unauthorized)
  end
end
