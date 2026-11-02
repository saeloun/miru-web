# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring applications", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:attributes) do
    { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email }
  end

  before do
    admin.add_role(:admin, company)
    sign_in admin
  end

  def create_application(**changes)
    Hiring::Intake.new(company:, actor: admin, attributes: attributes.merge(changes.stringify_keys)).process
  end

  def post_application(**changes)
    post "/api/v1/hiring/applications", params: { application: attributes.merge(changes.stringify_keys) }, as: :json
  end

  it "creates and safely retries manual intake with private response headers" do
    post_application(owner_employment_id: membership.id)
    expect(response).to have_http_status(:created)
    first = response.parsed_body.fetch("application")
    expect(first).to include("stage" => "received", "source" => "manual")
    expect(first.fetch("candidate")).to include("full_name" => attributes["full_name"], "email" => attributes["email"].downcase)
    expect(first.fetch("owner")).to include("id" => membership.id)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")

    post_application(owner_employment_id: membership.id)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("application", "id")).to eq(first["id"])
    post_application(notes: "Changed content")
    expect(response).to have_http_status(:conflict)
    expect(response.parsed_body).to include("existing_application_id" => first.fetch("id"), "company_id" => company.id)
    expect(HiringApplication.count).to eq(1)
  end

  it "rejects a changed workspace, unexpected fields and malformed values without creating records" do
    post_application(company_id: create(:company).id)
    expect(response).to have_http_status(:conflict)
    post_application(stage: "hired")
    expect(response).to have_http_status(422)
    post_application(email: ["not-a-single-address"])
    expect(response).to have_http_status(422)
    expect(HiringCandidate.count).to eq(0)
    expect(HiringApplication.count).to eq(0)
  end

  it "requires active Admin or Owner access and denies a stale browser's workspace" do
    admin.remove_role(:admin, company)
    admin.add_role(:employee, company)
    get "/api/v1/hiring/applications", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    post_application
    expect(response).to have_http_status(:forbidden)

    admin.add_role(:owner, company)
    get "/api/v1/hiring/applications", params: { company_id: create(:company).id }
    expect(response).to have_http_status(:conflict)
    membership.discard
    get "/api/v1/hiring/applications", params: { company_id: company.id }
    expect(response).to have_http_status(:unauthorized)
  end

  it "does not expose applications from another company" do
    application = create_application
    other = create(:company)
    other_admin = create(:user, current_workspace: other)
    create(:employment, company: other, user: other_admin, resigned_at: nil)
    other_admin.add_role(:admin, other)
    sign_in other_admin

    get "/api/v1/hiring/applications/#{application.id}", params: { company_id: other.id }
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include(attributes["email"], attributes["full_name"])
    get "/api/v1/hiring/applications", params: { company_id: other.id }
    expect(response.parsed_body.fetch("applications")).to eq([])
  end

  it "paginates application history without repeating or omitting rows" do
    21.times { create_application(request_key: SecureRandom.uuid) }
    get "/api/v1/hiring/applications", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    first = response.parsed_body
    expect(first.fetch("applications").length).to eq(20)
    expect(first.fetch("pagination")).to include("page" => 1, "has_more" => true)
    get "/api/v1/hiring/applications", params: { company_id: company.id, page: 2 }
    second = response.parsed_body
    expect(second.fetch("applications").length).to eq(1)
    expect(second.fetch("pagination")).to include("has_more" => false)
    ids = [*first["applications"], *second["applications"]].map { |item| item.fetch("id") }
    expect(ids.uniq.length).to eq(21)
  end

  it "filters by literal search, role, owner and workspace-local receipt dates" do
    role = HiringRole.create!(company:, title: Faker::Job.title)
    other_role = HiringRole.create!(company:, title: Faker::Job.title)
    match = create_application(full_name: "Applicant% literal", role_id: role.id, owner_employment_id: membership.id,
      received_at: "2026-09-15T14:00:00Z")
    second = create_application(email: Faker::Internet.unique.email, request_key: SecureRandom.uuid,
      role_id: other_role.id, received_at: "2026-09-16T14:00:00Z")
    screening = create_application(email: Faker::Internet.unique.email, request_key: SecureRandom.uuid,
      role_id: role.id, owner_employment_id: membership.id)
    screening.update!(stage: "screening")
    boundary = create_application(email: Faker::Internet.unique.email, request_key: SecureRandom.uuid,
      received_at: "2026-09-16T02:00:00Z")
    [[{ query: "%" }, [match]], [{ role_id: role.id }, [match, screening]],
      [{ owner_employment_id: membership.id }, [match, screening]], [{ stage: "screening" }, [screening]],
      [{ from: "2026-09-15", to: "2026-09-15" }, [match, boundary]],
      [{ from: "2026-09-15", to: "2026-09-16" }, [match, second, boundary]]].each do |filter, expected|
      get "/api/v1/hiring/applications", params: { company_id: company.id }.merge(filter)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch("applications").pluck("id")).to match_array(expected.map(&:id))
      expect(response.parsed_body.fetch("time_zone")).to eq("America/New_York")
    end

    [{ page: "0" }, { query: ["invalid"] }, { from: "2026-02-30" }, { stage: "unrecognized" },
      { from: "2026-09-16", to: "2026-09-15" }].each do |filter|
      get "/api/v1/hiring/applications", params: { company_id: company.id }.merge(filter)
      expect(response).to have_http_status(:bad_request)
    end
  end

  it "shows the current application and the candidate's separate application history" do
    first = create_application(notes: "Private note")
    second = create_application(request_key: SecureRandom.uuid, full_name: "A later submitted name")
    create_application(request_key: SecureRandom.uuid, email: Faker::Internet.unique.email)
    get "/api/v1/hiring/applications/#{first.id}", params: { company_id: company.id }

    expect(response).to have_http_status(:ok)
    data = response.parsed_body
    expect(data.fetch("application")).to include("notes" => "Private note", "submitted_name" => attributes["full_name"])
    expect(data.fetch("history").pluck("id")).to eq([second.id, first.id])
    expect(data.fetch("history").last).not_to have_key("notes")
  end

  it "returns only active staff owners from the current company" do
    client = create(:user, current_workspace: company)
    create(:employment, company:, user: client, resigned_at: nil)
    client.add_role(:client, company)
    get "/api/v1/hiring/owners", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("owners").pluck("id")).to eq([membership.id])
    expect(response.body).not_to include(client.email, admin.email)
  end

  it "filters the complete intake payload from request logs" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    expect(filter.filter("application" => attributes.merge("notes" => "Private screening note")))
      .to eq("application" => "[FILTERED]")
  end

  it "accepts private searches in a filtered body without putting candidate details in the request URL" do
    record = create_application
    post "/api/v1/hiring/applications/search", params: {
      hiring_search: { company_id: company.id, query: attributes["email"], page: 1 }
    }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("applications").pluck("id")).to eq([record.id])
    expect(request.filtered_path).not_to include(attributes["email"])
    expect(request.filtered_parameters.fetch("hiring_search")).to eq("[FILTERED]")
    get "/api/v1/hiring/applications", params: { company_id: company.id, query: attributes["email"] }
    expect(request.filtered_path).not_to include(attributes["email"])
    expect(request.filtered_parameters.fetch("query")).to eq("[FILTERED]")
  end

  it "keeps referenced former owners in history choices without making them assignable to new intake" do
    employee = create(:user, current_workspace: company)
    former = create(:employment, company:, user: employee, resigned_at: nil)
    employee.add_role(:employee, company)
    create_application(owner_employment_id: former.id)
    former.discard

    post "/api/v1/hiring/owners/search", params: {
      hiring_search: { company_id: company.id, query: employee.full_name, include_history: true, page: 1 }
    }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("owners")).to include(hash_including("id" => former.id, "active" => false))
    get "/api/v1/hiring/owners", params: { company_id: company.id }
    expect(response.parsed_body.fetch("owners").pluck("id")).not_to include(former.id)
    post_application(request_key: SecureRandom.uuid, owner_employment_id: former.id)
    expect(response).to have_http_status(422)
  end

  it "rejects embedded nulls in private search text without querying PostgreSQL with invalid text" do
    post "/api/v1/hiring/applications/search", params: {
      hiring_search: { company_id: company.id, query: "Candidate\u0000" }
    }, as: :json
    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body).to eq("errors" => "Invalid hiring parameters.")
  end

  it "rejects cookie-authenticated writes without CSRF and accepts a genuine browser token" do
    previous_base = ActionController::Base.allow_forgery_protection
    previous_hiring = Api::V1::Hiring::BaseController.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = true
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    post_application
    expect(response).to have_http_status(422)
    expect(HiringApplication.count).to eq(0)

    get "/"
    token = Nokogiri::HTML(response.body).at_css('meta[name="csrf-token"]')&.[]("content")
    expect(token).to be_present
    post "/api/v1/hiring/applications", params: { application: attributes },
      headers: { "X-CSRF-Token" => token }, as: :json
    expect(response).to have_http_status(:created)
  ensure
    ActionController::Base.allow_forgery_protection = previous_base
    Api::V1::Hiring::BaseController.allow_forgery_protection = previous_hiring if defined?(Api::V1::Hiring::BaseController)
  end
end
