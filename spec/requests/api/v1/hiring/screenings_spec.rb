# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring screening", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email
    }).process
  end

  before do
    admin.add_role(:admin, company)
    sign_in admin
  end

  def screen(**changes)
    post "/api/v1/hiring/applications/#{application.id}/screenings", params: {
      screening: { company_id: company.id, lock_version: application.lock_version, action: "shortlist" }.merge(changes)
    }, as: :json
  end

  it "shortlists explicitly, assigning an open role and retaining a private decision" do
    role = company.hiring_roles.create!(title: Faker::Job.title)
    creation = application.creation_details.deep_dup
    screen(role_id: role.id, owner_employment_id: membership.id, reason: "Relevant Rails experience")
    expect(response).to have_http_status(:created)
    expect(response.parsed_body.fetch("application")).to include("stage" => "shortlisted", "lock_version" => 1)
    expect(application.reload).to have_attributes(stage: "shortlisted", hiring_role_id: role.id, owner_employment_id: membership.id)
    expect(application.creation_details).to eq(creation)
    get "/api/v1/hiring/applications/#{application.id}/screenings", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    decision = response.parsed_body.fetch("screenings").sole
    expect(decision).to include("action" => "shortlist", "from_stage" => "received", "to_stage" => "shortlisted")
    expect(decision.dig("details", "reason")).to eq("Relevant Rails experience")
    expect(decision.dig("details", "actor_name")).to eq(admin.full_name)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(HiringMessage.count).to eq(0)
  end

  it "rejects stale versions and a browser that changed workspace without changing the decision" do
    screen(lock_version: 7)
    expect(response).to have_http_status(:conflict)
    screen(company_id: create(:company).id)
    expect(response).to have_http_status(:conflict)
    expect(application.reload.stage).to eq("received")
    expect(application.hiring_screenings).to be_empty
  end

  it "requires current Admin or Owner membership for reads and decisions" do
    application
    admin.remove_role(:admin, company)
    admin.add_role(:employee, company)
    screen
    expect(response).to have_http_status(:forbidden)
    get "/api/v1/hiring/applications/#{application.id}/screenings", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    admin.add_role(:admin, company)
    membership.update!(resigned_at: Date.yesterday)
    screen
    expect(response).to have_http_status(:forbidden)
    expect(application.reload.stage).to eq("received")
  end

  it "retains repeat information requests and never rewrites the earlier reason" do
    screen(action: "request_information", reason: "Please explain your Rails contribution")
    expect(response).to have_http_status(:created)
    application.reload
    screen(action: "request_information", reason: "Please clarify your availability")
    expect(response).to have_http_status(:created)
    expect(application.reload).to have_attributes(stage: "information_pending", lock_version: 2)
    get "/api/v1/hiring/applications/#{application.id}/screenings", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("screenings").map { |item| item.dig("details", "reason") })
      .to eq(["Please clarify your availability", "Please explain your Rails contribution"])
    record = application.hiring_screenings.first
    raw = record.class.connection.select_value("SELECT details FROM hiring_screenings WHERE id = #{record.id.to_i}")
    expect(raw).not_to include("Please explain", admin.full_name)
    expect { record.update!(details: {}) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(HiringMessage.count).to eq(0)
  end

  it "keeps rejection pending and refuses missing reasons, closed roles and foreign owners" do
    screen(action: "reject", reason: "")
    expect(response).to have_http_status(:unprocessable_content)
    role = company.hiring_roles.create!(title: Faker::Job.title, status: "closed")
    screen(role_id: role.id)
    expect(response).to have_http_status(:unprocessable_content)
    foreign = create(:employment)
    screen(owner_employment_id: foreign.id)
    expect(response).to have_http_status(:unprocessable_content)
    screen(action: "reject", reason: "Role experience does not match")
    expect(response).to have_http_status(:created)
    expect(application.reload.stage).to eq("rejection_pending")
    expect(HiringMessage.count).to eq(0)
  end

  it "rejects malformed path identities instead of coercing them into a real application" do
    get "/api/v1/hiring/applications/#{application.id}junk/screenings", params: { company_id: company.id }
    expect(response).to have_http_status(:bad_request)
    post "/api/v1/hiring/applications/#{application.id}junk/screenings",
      params: { screening: { company_id: company.id, lock_version: 0, action: "shortlist" } }, as: :json
    expect(response).to have_http_status(:bad_request)
    expect(application.reload.stage).to eq("received")
  end

  it "changes role ownership separately from progression and can move directly to interview" do
    role = company.hiring_roles.create!(title: Faker::Job.title)
    screen(action: "update_details", role_id: role.id, owner_employment_id: membership.id)
    expect(response).to have_http_status(:created)
    expect(application.reload).to have_attributes(stage: "received", lock_version: 1)
    screen(action: "interview")
    expect(response).to have_http_status(:created)
    expect(application.reload).to have_attributes(stage: "interview", lock_version: 2)
    expect(application.hiring_screenings.count).to eq(2)
    expect(HiringMessage.count).to eq(0)
  end

  it "rejects malformed choices, unknown fields and closed applications without writing history" do
    [{ role_id: [] }, { owner_employment_id: false }, { action: "hired" }, { reason: ["private"] }].each do |changes|
      screen(**changes)
      expect(response).to have_http_status(:unprocessable_content)
    end
    screen(admin: true)
    expect(response).to have_http_status(:bad_request)
    application.update!(stage: "hired")
    screen
    expect(response).to have_http_status(:unprocessable_content)
    expect(application.hiring_screenings).to be_empty
  end

  it "scopes history to the workspace, constrains it in the database and deletes it with its company" do
    screen(reason: "Private screening context")
    expect(response).to have_http_status(:created)
    record = application.hiring_screenings.sole
    other = create(:company)
    expect do
      record.class.transaction(requires_new: true) { record.update_columns(company_id: other.id) }
    end.to raise_error(ActiveRecord::InvalidForeignKey)
    expect(application.audits.map(&:audited_changes).to_s).not_to include("Private screening context")
    original = company
    admin.update!(current_workspace: other)
    admin.add_role(:owner, other)
    create(:employment, company: other, user: admin, resigned_at: nil)
    get "/api/v1/hiring/applications/#{application.id}/screenings", params: { company_id: other.id }
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include("Private screening context")
    original.destroy!
    expect(HiringScreening.exists?(record.id)).to be(false)
  end

  it "filters private screening reasons from actual request instrumentation" do
    payloads = []
    subscriber = ActiveSupport::Notifications.subscribe("process_action.action_controller") do |*event|
      payload = event.last
      payloads << payload if payload[:controller] == "Api::V1::Hiring::ScreeningsController" && payload[:action] == "create"
    end
    screen(reason: "Private employment assessment")
    expect(response).to have_http_status(:created)
    expect(payloads.sole.fetch(:params)).to include("screening" => "[FILTERED]")
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
  end
end
