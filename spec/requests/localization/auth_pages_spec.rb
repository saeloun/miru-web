# frozen_string_literal: true

require "rails_helper"

RSpec.describe "localized auth pages", type: :request do
  it "renders the login shell for supported browser locales" do
    get "/login", headers: { "Accept-Language" => "hi-IN,hi;q=0.9,en;q=0.8" }

    expect(response).to have_http_status(:ok)
  end
end
