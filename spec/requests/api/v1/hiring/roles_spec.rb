# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring roles", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }

  before do
    admin.add_role(:admin, company)
    sign_in admin
  end

  it "creates, searches and closes roles while rejecting stale edits" do
    title = Faker::Job.title
    post "/api/v1/hiring/roles", params: { role: { company_id: company.id, title: } }, as: :json
    expect(response).to have_http_status(:created)
    role = response.parsed_body.fetch("role")
    expect(role).to include("title" => title, "status" => "open", "lock_version" => 0)
    get "/api/v1/hiring/roles", params: { company_id: company.id, query: title, status: "open" }
    expect(response.parsed_body.fetch("roles").pluck("id")).to eq([role["id"]])

    patch "/api/v1/hiring/roles/#{role['id']}", params: {
      role: { company_id: company.id, lock_version: 0, title:, status: "closed" }
    }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("role", "status")).to eq("closed")
    patch "/api/v1/hiring/roles/#{role['id']}", params: {
      role: { company_id: company.id, lock_version: 0, title: "Stale overwrite", status: "open" }
    }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(HiringRole.find(role["id"]).status).to eq("closed")
  end

  it "denies cross-company role edits, malformed titles and employee access" do
    foreign = HiringRole.create!(company: create(:company), title: Faker::Job.title)
    patch "/api/v1/hiring/roles/#{foreign.id}", params: {
      role: { company_id: company.id, lock_version: 0, title: "Cross-company", status: "closed" }
    }, as: :json
    expect(response).to have_http_status(:not_found)
    post "/api/v1/hiring/roles", params: { role: { company_id: company.id, title: ["bad"] } }, as: :json
    expect(response).to have_http_status(422)
    post "/api/v1/hiring/roles", params: { role: { company_id: company.id, title: "Bad\u0000role" } }, as: :json
    expect(response).to have_http_status(422)

    admin.remove_role(:admin, company)
    admin.add_role(:employee, company)
    post "/api/v1/hiring/roles", params: { role: { company_id: company.id, title: "Unpermitted" } }, as: :json
    expect(response).to have_http_status(:forbidden)
  end
end
