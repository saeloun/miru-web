# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin hiring decisions", type: :request do
  include_context "interview message records"
  before { sign_in admin }

  def decisions_path = "/api/v1/hiring/applications/#{application.id}/decisions"

  def draft_attributes(**changes)
    { company_id: company.id, application_version: application.reload.lock_version, request_key: SecureRandom.uuid,
      outcome: "hold", reason: "PRIVATE DECISION REASON", owner_employment_id: staff.id, follow_up_on: "2026-11-10" }.merge(changes)
  end

  def create_draft(attributes = nil, **changes)
    attributes ||= draft_attributes(**changes)
    post decisions_path, params: { hiring_decision: attributes }, as: :json
    expect(response).to have_http_status(:created), response.body
    company.hiring_decisions.find(response.parsed_body.dig("decision", "id"))
  end

  def final_attributes(decision)
    { company_id: company.id, application_version: application.reload.lock_version, decision_version: decision.reload.lock_version }
  end

  def finalize(decision, attributes = final_attributes(decision))
    post "#{decisions_path}/#{decision.id}/finalize", params: { hiring_decision: attributes }, as: :json
  end

  it "saves a private draft without changing stage, scheduling or sending mail" do
    booking
    decision = create_draft
    expect(decision.state).to eq("draft")
    expect(application.reload.stage).to eq("interview")
    expect(booking.reload.status).to eq("scheduled")
    expect(HiringMessage.count).to eq(0)
    expect(decision.read_attribute_before_type_cast("details")).not_to include("PRIVATE DECISION REASON")
    expect(response.headers["Cache-Control"]).to include("no-store")
  end

  it "recovers exact draft creation intent, including an uppercase UUID, before checking its old version" do
    input = draft_attributes(request_key: SecureRandom.uuid.upcase)
    decision = create_draft(input)
    post decisions_path, params: { hiring_decision: input }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("decision", "id")).to eq(decision.id)
    post decisions_path, params: { hiring_decision: input.merge(reason: "Different intent") }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(company.hiring_decisions.count).to eq(1)
  end

  it "edits one draft with exact lost-response recovery and rejects a stale different edit" do
    decision = create_draft
    input = draft_attributes.except(:request_key).merge(decision_version: decision.lock_version, reason: "Updated private reason")
    2.times do
      patch "#{decisions_path}/#{decision.id}", params: { hiring_decision: input }, as: :json
      expect(response).to have_http_status(:ok)
    end
    patch "#{decisions_path}/#{decision.id}", params: { hiring_decision: input.merge(reason: "Stale overwrite") }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(decision.reload.details.fetch("reason")).to eq("Updated private reason")
    post decisions_path, params: { hiring_decision: draft_attributes }, as: :json
    expect(response).to have_http_status(:conflict)
  end

  it "requires a reason, active owner and follow-up date before finalizing a hold" do
    decision = create_draft(reason: "", owner_employment_id: nil, follow_up_on: nil)
    finalize(decision)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(decision.reload.state).to eq("draft")
    expect(application.reload.stage).to eq("received")
    expect(HiringMessage.count).to eq(0)
  end

  it "finalizes a hold once, records ownership and preserves the cancelled booking history" do
    booking
    decision = create_draft
    input = final_attributes(decision)
    2.times do
      finalize(decision, input)
      expect(response).to have_http_status(:ok)
    end
    expect(decision.reload.state).to eq("finalized")
    expect(decision.finalized_by).to eq(admin)
    expect(application.reload.stage).to eq("on_hold")
    expect(application.owner_employment).to eq(staff)
    expect(booking.reload.status).to eq("cancelled")
    expect(decision.details).to include("owner_name" => interviewer.full_name, "time_zone" => company.resolved_time_zone.tzinfo.name)
    expect { decision.update!(details: decision.details.merge("reason" => "Rewrite history")) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(HiringMessage.count).to eq(0)
  end

  it "rejects finalization when the application or decision changed" do
    decision = create_draft
    input = final_attributes(decision)
    application.touch
    finalize(decision, input)
    expect(response).to have_http_status(:conflict)
    expect(decision.reload.state).to eq("draft")
    finalize(decision, final_attributes(decision).merge(decision_version: 999))
    expect(response).to have_http_status(:conflict)
  end

  it "rejects a hold owner who left after the draft was saved" do
    decision = create_draft
    staff.update!(resigned_at: Date.yesterday)
    finalize(decision)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(decision.reload.state).to eq("draft")
  end

  it "checks the follow-up date in the saved company zone and does not invalidate historical dates later" do
    company.update!(timezone: "America/Los_Angeles")
    travel_to(Time.utc(2026, 11, 4, 1))
    decision = create_draft(follow_up_on: "2026-11-03")
    finalize(decision)
    expect(response).to have_http_status(:ok)
    travel 3.days
    expect(decision.reload).to be_valid
  end

  it "rejects a past follow-up date at finalization, invalid calendar dates and another company's owner" do
    post decisions_path, params: { hiring_decision: draft_attributes(follow_up_on: "2026-02-30") }, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    other = create(:employment, company: create(:company), resigned_at: nil)
    post decisions_path, params: { hiring_decision: draft_attributes(owner_employment_id: other.id) }, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    decision = create_draft(follow_up_on: "2026-11-02")
    finalize(decision)
    expect(response).to have_http_status(:unprocessable_entity)
  end

  { "pass" => "final_decision", "reject" => "rejected", "additional_round_required" => "interview" }.each do |outcome, stage|
    it "finalizes #{outcome} without implicitly creating offers, rounds or emails" do
      decision = create_draft(outcome:, owner_employment_id: nil, follow_up_on: nil)
      finalize(decision)
      expect(response).to have_http_status(:ok)
      expect(application.reload.stage).to eq(stage)
      expect(application.hiring_interviews).to be_empty
      expect(HiringMessage.count).to eq(0)
    end
  end

  it "requires a separate new draft to revise a finalized hold and keeps its old reason" do
    old = create_draft
    finalize(old)
    replacement = create_draft(outcome: "additional_round_required", reason: "Resume interviews", owner_employment_id: nil, follow_up_on: nil)
    finalize(replacement)
    expect(response).to have_http_status(:ok)
    expect(old.reload.details.fetch("reason")).to eq("PRIVATE DECISION REASON")
    expect(application.reload.stage).to eq("interview")
    get decisions_path, params: { company_id: company.id }
    expect(response.parsed_body.fetch("decisions").pluck("id")).to eq([replacement.id, old.id])
    expect(response.parsed_body.fetch("current_decision_id")).to eq(replacement.id)
  end

  it "denies edits to finalized decisions, closed applications, foreign records and revoked Admins" do
    decision = create_draft(outcome: "reject", owner_employment_id: nil, follow_up_on: nil)
    finalize(decision)
    patch "#{decisions_path}/#{decision.id}", params: { hiring_decision: draft_attributes.except(:request_key).merge(decision_version: decision.reload.lock_version) }, as: :json
    expect(response).to have_http_status(:conflict)
    post decisions_path, params: { hiring_decision: draft_attributes }, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    other_company = create(:company)
    other_admin = create(:user, current_workspace: other_company)
    create(:employment, company: other_company, user: other_admin, resigned_at: nil)
    other_admin.add_role(:admin, other_company)
    foreign = Hiring::Intake.new(company: other_company, actor: other_admin, attributes: {
      "company_id" => other_company.id, "request_key" => SecureRandom.uuid, "full_name" => Faker::Name.name, "email" => "foreign@example.test"
    }).process
    get "/api/v1/hiring/applications/#{foreign.id}/decisions", params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    admin.remove_role(:admin, company)
    get decisions_path, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include("PRIVATE DECISION REASON")
  end

  it "rejects reuse of one draft request identity for a different application" do
    input = draft_attributes
    create_draft(input)
    other = Hiring::Intake.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "request_key" => SecureRandom.uuid, "full_name" => Faker::Name.name, "email" => "another@example.test"
    }).process
    post "/api/v1/hiring/applications/#{other.id}/decisions", params: { hiring_decision: input }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(company.hiring_decisions.count).to eq(1)
  end

  it "rejects malformed/unapproved mutation fields and filters the new private envelope" do
    post decisions_path, params: { hiring_decision: draft_attributes.merge(finalized_at: Time.current) }, as: :json
    expect(response).to have_http_status(:bad_request)
    ["x" * 5001, "bad\u0001reason"].each do |reason|
      post decisions_path, params: { hiring_decision: draft_attributes(reason:) }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
    filtered = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters).filter("hiring_decision" => draft_attributes)
    expect(filtered.fetch("hiring_decision")).to eq("[FILTERED]")
  end
end
