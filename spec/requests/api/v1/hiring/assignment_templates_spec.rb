# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring assignment library", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:details) do
    { "instructions" => "Build a small searchable catalogue", "criteria" => "Explain tradeoffs and exercise failure cases",
      "expected_minutes" => 90, "submission_method" => "repository_or_files", "ai_policy" => "Tools are allowed; disclose how and where they were used" }
  end
  let(:attributes) { { company_id: company.id, title: "Rails catalogue", skills: "Rails, PostgreSQL", experience: "Mid-level", details: } }

  before do
    admin.add_role(:admin, company)
    sign_in admin
  end

  def create_template(values = {})
    post "/api/v1/hiring/assignment_templates", params: { hiring_assignment_template: attributes.merge(values) }, as: :json
  end

  def template
    @template ||= begin
      create_template
      expect(response).to have_http_status(:created)
      HiringAssignmentTemplate.find(response.parsed_body.fetch("template").fetch("id"))
    end
  end

  def mutate(action, values = {})
    post "/api/v1/hiring/assignment_templates/#{template.id}/#{action}",
      params: { hiring_assignment_template: { company_id: company.id, lock_version: template.reload.lock_version }.merge(values) }, as: :json
  end

  it "keeps new library tasks as drafts without assigning or emailing applicants" do
    create_template
    expect(response).to have_http_status(:created)
    result = response.parsed_body.fetch("template")
    expect(result).to include("title" => "Rails catalogue", "status" => "draft", "lock_version" => 0, "details" => details)
    expect(response.headers["Cache-Control"]).to include("no-store")
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(HiringApplication.count).to eq(0)
  end

  it "requires complete approved terms and retains each version after later edits" do
    original = template
    mutate("approve")
    expect(response).to have_http_status(:ok)
    approved = response.parsed_body.fetch("template")
    expect(approved).to include("status" => "approved", "lock_version" => 1)
    patch "/api/v1/hiring/assignment_templates/#{original.id}", params: { hiring_assignment_template: attributes.merge(
      lock_version: 1, details: details.merge("expected_minutes" => 45)) }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("template")).to include("status" => "draft", "lock_version" => 2)
    get "/api/v1/hiring/assignment_templates/#{original.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    revisions = response.parsed_body.fetch("revisions")
    expect(revisions.pluck("template_version")).to eq([2, 1, 0])
    expect(revisions[1].fetch("snapshot")).to include("status" => "approved", "details" => details, "actor_name" => admin.full_name)
    row = original.revisions.find_by!(template_version: 1)
    expect(row.update(snapshot: {})).to be(false)
    expect(row.attributes_before_type_cast.fetch("snapshot")).not_to include("Tools are allowed")
    expect(original.reload.attributes_before_type_cast.fetch("details")).not_to include("Build a small")
  end

  it "can save an incomplete draft but cannot approve it or lose a stale edit" do
    create_template(details: {})
    expect(response).to have_http_status(:created)
    @template = HiringAssignmentTemplate.find(response.parsed_body.fetch("template").fetch("id"))
    mutate("approve")
    expect(response).to have_http_status(:unprocessable_entity)
    expect(template.reload.status).to eq("draft")
    patch "/api/v1/hiring/assignment_templates/#{template.id}", params: {
      hiring_assignment_template: attributes.merge(lock_version: 0) }, as: :json
    expect(response).to have_http_status(:ok)
    mutate("archive", lock_version: 0)
    expect(response).to have_http_status(:conflict)
    expect(template.reload.status).to eq("draft")
  end

  it "scopes role choices, records the historical role title and searches literal skills/experience" do
    role = company.hiring_roles.create!(title: "Rails Engineer")
    create_template(role_id: role.id, skills: "Rails 100%", experience: "Senior")
    expect(response).to have_http_status(:created)
    @template = HiringAssignmentTemplate.find(response.parsed_body.fetch("template").fetch("id"))
    role.update!(title: "Renamed role", status: "closed")
    mutate("approve")
    expect(response).to have_http_status(:unprocessable_entity)
    get "/api/v1/hiring/assignment_templates/#{template.id}", params: { company_id: company.id }
    expect(response.parsed_body.fetch("revisions").last.dig("snapshot", "role", "title")).to eq("Rails Engineer")
    post "/api/v1/hiring/assignment_templates/search", params: { hiring_search: { company_id: company.id, query: "%", role_id: role.id } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("templates").pluck("id")).to eq([template.id])
    foreign = create(:company).hiring_roles.create!(title: "Private role")
    create_template(role_id: foreign.id)
    expect(response).to have_http_status(:unprocessable_entity)
    create_template(role_id: "#{role.id}junk")
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "denies employees, another workspace and malformed input without changing the library" do
    original = template
    get "/api/v1/hiring/assignment_templates/#{original.id}junk", params: { company_id: company.id }
    expect(response).to have_http_status(:bad_request)
    create_template(details: details.merge("expected_minutes" => "90"))
    expect(response).to have_http_status(:unprocessable_entity)
    create_template(details: details.merge("unsafe_extra" => true))
    expect(response).to have_http_status(:unprocessable_entity)
    create_template(title: "Bad\0title")
    expect(response).to have_http_status(:unprocessable_entity)
    create_template(skills: ["Rails"])
    expect(response).to have_http_status(:unprocessable_entity)
    create_template(title: 123)
    expect(response).to have_http_status(:unprocessable_entity)
    mutate("approve", company_id: create(:company).id)
    expect(response).to have_http_status(:conflict)
    admin.remove_role(:admin, company)
    admin.add_role(:employee, company)
    get "/api/v1/hiring/assignment_templates", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(original.reload.lock_version).to eq(0)
  end

  it "keeps other tenants private and revokes management when staff membership ends" do
    original = template
    other = create(:company)
    foreign = other.hiring_assignment_templates.create!(title: "Other tenant task", skills: "Private skill", details: {})
    get "/api/v1/hiring/assignment_templates/#{foreign.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include("Other tenant task")
    post "/api/v1/hiring/assignment_templates/search", params: {
      hiring_search: { company_id: company.id, query: "Private skill" } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("templates")).to be_empty
    create(:employment, company: other, user: admin, resigned_at: nil)
    admin.add_role(:employee, other)
    membership.update!(resigned_at: Date.yesterday)
    patch "/api/v1/hiring/assignment_templates/#{original.id}", params: { hiring_assignment_template: attributes.merge(lock_version: 0) }, as: :json
    expect(response).to have_http_status(:forbidden)
    expect(original.reload.lock_version).to eq(0)
  end

  it "filters task content out of actual request instrumentation" do
    payloads = []
    subscriber = ActiveSupport::Notifications.subscribe("process_action.action_controller") do |*event|
      payloads << event.last if event.last[:controller] == "Api::V1::Hiring::AssignmentTemplatesController"
    end
    create_template
    expect(response).to have_http_status(:created)
    expect(payloads.sole.fetch(:params)).to include("hiring_assignment_template" => "[FILTERED]")
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
  end

  it "paginates the library and revision history without omitting or mixing records" do
    original = template
    21.times do |index|
      Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
        "company_id" => company.id, "lock_version" => original.reload.lock_version, "skills" => "Revision #{index}"
      }).process(template: original)
    end
    get "/api/v1/hiring/assignment_templates/#{original.id}", params: { company_id: company.id }
    first = response.parsed_body.fetch("revisions")
    expect(first.pluck("template_version")).to eq((2..21).to_a.reverse)
    expect(response.parsed_body.dig("pagination", "has_more")).to be(true)
    get "/api/v1/hiring/assignment_templates/#{original.id}", params: { company_id: company.id, page: 2 }
    expect(response.parsed_body.fetch("revisions").pluck("template_version")).to eq([1, 0])
    expect(response.parsed_body.dig("pagination", "has_more")).to be(false)
    21.times { |index| company.hiring_assignment_templates.create!(title: "Task #{index.to_s.rjust(2, '0')}", details: {}) }
    get "/api/v1/hiring/assignment_templates", params: { company_id: company.id }
    ids = response.parsed_body.fetch("templates").pluck("id")
    expect(ids.size).to eq(20)
    get "/api/v1/hiring/assignment_templates", params: { company_id: company.id, page: 2 }
    more = response.parsed_body.fetch("templates").pluck("id")
    expect(more.size).to eq(2)
    expect(ids & more).to be_empty
  end
end
