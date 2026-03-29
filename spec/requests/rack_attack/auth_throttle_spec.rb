# frozen_string_literal: true

require "rails_helper"

RSpec.describe "RackAttack auth throttles", type: :request do
  let(:ip_address) { "203.0.113.10" }
  let(:json_headers) { { "CONTENT_TYPE" => "application/json", "REMOTE_ADDR" => ip_address } }

  before do
    Rack::Attack.enabled = true
    Rack::Attack.cache.store.clear if Rack::Attack.cache.store.respond_to?(:clear)
  end

  after do
    Rack::Attack.enabled = false
    Rack::Attack.cache.store.clear if Rack::Attack.cache.store.respond_to?(:clear)
  end

  it "throttles repeated login attempts from the same ip" do
    20.times do
      post api_v1_users_login_path,
        params: { user: { email: "missing@example.com", password: "bad-password" } }.to_json,
        headers: json_headers

      expect(response).to have_http_status(:unprocessable_entity)
    end

    post api_v1_users_login_path,
      params: { user: { email: "missing@example.com", password: "bad-password" } }.to_json,
      headers: json_headers

    expect(response).to have_http_status(:too_many_requests)
    expect(response.parsed_body["error"]).to eq("Too many requests. Please try again later.")
  end

  it "throttles repeated recovery requests from the same ip" do
    10.times do
      post api_v1_users_forgot_password_path,
        params: { user: { email: "missing@example.com" } }.to_json,
        headers: json_headers

      expect(response).to have_http_status(:ok)
    end

    post api_v1_users_forgot_password_path,
      params: { user: { email: "missing@example.com" } }.to_json,
      headers: json_headers

    expect(response).to have_http_status(:too_many_requests)
    expect(response.parsed_body["error"]).to eq("Too many requests. Please try again later.")
  end
end
