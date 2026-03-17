# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Content Security Policy", type: :request do
  it "returns a report-only csp header" do
    get root_path

    expect(response).to have_http_status(:ok)
    expect(response.headers["Content-Security-Policy-Report-Only"]).to include("default-src 'self' https:")
    expect(response.headers["Content-Security-Policy-Report-Only"]).to include("object-src 'none'")
  end
end
