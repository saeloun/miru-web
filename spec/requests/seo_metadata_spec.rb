# frozen_string_literal: true

require "rails_helper"

RSpec.describe "SEO metadata", type: :request do
  it "excludes tracking parameters from canonical and Open Graph URLs" do
    get "/signup", params: {
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "1k_mrr"
    }
    expect(response).to have_http_status(:ok)

    document = Nokogiri::HTML(response.body)

    expect(document.at_css('link[rel="canonical"]')["href"]).to eq("http://www.example.com/signup")
    expect(document.at_css('meta[property="og:url"]')["content"]).to eq("http://www.example.com/signup")
  end
end
