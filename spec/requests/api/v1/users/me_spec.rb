# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users::Sessions#me", type: :request do
  let(:company) { create(:company, date_format: "DD-MM-YYYY") }
  let(:user) do
    create(
      :user,
      locale: "hi",
      current_workspace_id: company.id,
      date_of_birth: Date.new(1992, 4, 10),
      phone: "+919999999999",
      personal_email_id: "person@example.com",
      social_accounts: {
        github_url: "https://github.com/example",
        linkedin_url: "https://linkedin.com/in/example"
      }
    )
  end

  before do
    create(:employment, company:, user:)
    user.add_role :owner, company
    sign_in user
  end

  it "returns current user info" do
    get api_v1_users_me_path, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response["user"]["id"]).to eq(user.id)
    expect(json_response["user"]["email"]).to eq(user.email)
    expect(json_response["user"]["first_name"]).to eq(user.first_name)
    expect(json_response["user"]["last_name"]).to eq(user.last_name)
    expect(json_response["user"]["phone"]).to eq(user.phone)
    expect(json_response["user"]["personal_email_id"]).to eq(user.personal_email_id)
    expect(json_response["user"]["social_accounts"]).to eq(user.social_accounts)
    expect(json_response["user"]["date_format"]).to eq(company.date_format)
    expect(json_response["user"]["locale"]).to eq("hi")
  end

  it "returns company info" do
    get api_v1_users_me_path, headers: auth_headers(user)

    expect(json_response["company"]["id"]).to eq(company.id)
    expect(json_response["company"]["name"]).to eq(company.name)
  end

  it "returns the user role" do
    get api_v1_users_me_path, headers: auth_headers(user)

    expect(json_response["company_role"]).to eq("owner")
  end
end
