# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Content Security Policy", type: :request do
  it "returns an enforced csp header" do
    get root_path

    expect(response).to have_http_status(:ok)
    expect(response.headers["Content-Security-Policy"]).to include("default-src 'self' https:")
    expect(response.headers["Content-Security-Policy"]).to include("object-src 'none'")
    expect(response.headers["Content-Security-Policy-Report-Only"]).to be_nil
  end
end
