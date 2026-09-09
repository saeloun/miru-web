# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Forgery protection", type: :request do
  it "rejects an unverified confirmation request" do
    with_forgery_protection do
      post "/users/confirmation"
    end

    expect(response).to have_http_status(:unprocessable_content)
  end
end
