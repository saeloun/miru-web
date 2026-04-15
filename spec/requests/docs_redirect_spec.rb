# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Docs redirects", type: :request do
  it "redirects /docs to hosted docs" do
    get "/docs"

    expect(response).to have_http_status(:moved_permanently)
    expect(response).to redirect_to("https://docs.miru.so")
  end

  it "redirects nested docs paths and preserves query params" do
    get "/docs/contributing-guide/setup/macos", params: { q: "agent" }

    expect(response).to have_http_status(:moved_permanently)
    expect(response.location).to eq(
      "https://docs.miru.so/contributing-guide/setup/macos?q=agent"
    )
  end
end
