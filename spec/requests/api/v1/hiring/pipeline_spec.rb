# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring pipeline", type: :request do
  include_context "interview message records"

  before { sign_in admin }

  it "returns an Admin-only private tenant-scoped overview without private assessment material" do
    booking
    get "/api/v1/hiring/pipeline", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body).to include("company_id" => company.id)
    expect(body.dig("metrics", "total_applications")).to eq(1)
    expect(body.dig("queues", "upcoming_interviews")).to eq(1)
    expect(body.fetch("applications").pluck("id")).to eq([application.id])
    expect(response.body).not_to include("PRIVATE ADMIN NOTE", "PRIVATE CRITERIA", "PRIVATE QUESTION", "PRIVATE EXPERTISE")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
    expect(HiringMessage.count).to eq(0)
  end

  it "uses POST search for candidate filters and returns the same filtered metrics and queue" do
    booking
    post "/api/v1/hiring/pipeline/search", params: { hiring_search: { company_id: company.id, query: "candidate@example.test",
      interviewer_panel_member_id: panel.id, queue: "upcoming_interviews", page: 1 } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("applications").pluck("id")).to eq([application.id])
    expect(response.parsed_body.dig("metrics", "total_applications")).to eq(1)
    post "/api/v1/hiring/pipeline/search", params: { hiring_search: { company_id: company.id, query: "No match" } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("metrics", "total_applications")).to eq(0)
    expect(response.parsed_body.fetch("applications")).to be_empty
  end

  it "rejects stale workspaces, unknown fields and malformed input" do
    get "/api/v1/hiring/pipeline"
    expect(response).to have_http_status(:conflict)
    post "/api/v1/hiring/pipeline/search", params: { hiring_search: { company_id: create(:company).id } }, as: :json
    expect(response).to have_http_status(:conflict)
    post "/api/v1/hiring/pipeline/search", params: { hiring_search: { company_id: company.id, unsafe: true } }, as: :json
    expect(response).to have_http_status(:bad_request)
    post "/api/v1/hiring/pipeline/search", params: { hiring_search: { company_id: company.id, experience_min: {} } }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "blocks assigned interviewers, inactive administrators and cross-workspace requests" do
    booking
    sign_in interviewer
    get "/api/v1/hiring/pipeline", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    sign_in admin
    membership.update!(resigned_at: Date.yesterday)
    get "/api/v1/hiring/pipeline", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    membership.update!(resigned_at: nil)
    get "/api/v1/hiring/pipeline", params: { company_id: create(:company).id }
    expect(response).to have_http_status(:conflict)
  end
end
