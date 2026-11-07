# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Interview feedback", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:interviewer) { create(:user, current_workspace: company) }
  let!(:staff) { create(:employment, company:, user: interviewer, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email }).process
  end
  let(:panel) { HiringPanelMember.create!(company:, employment: staff, details: { "expertise" => "Rails" }) }
  let(:round) do
    Hiring::Interviews.new(application:, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
      "details" => { "title" => "Technical discussion", "kind" => "Technical", "duration_minutes" => 45,
        "criteria" => "Discuss tests", "preparation" => "Bring a project", "feedback_questions" => ["Explain the tradeoff"] },
      "panel" => [{ "panel_member_id" => panel.id, "compensation_access" => false }]
    })
  end
  let(:booking) do
    Hiring::Scheduling.new(interview: round, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "interview_version" => round.reload.lock_version,
      "request_key" => SecureRandom.uuid, "starts_local" => "2026-11-01T14:30", "candidate_time_zone" => "Asia/Kolkata",
      "feedback_hours" => 24, "meeting_url" => "https://meet.example.test/synthetic", "booking_instructions" => "Contact the hiring team"
    })
  end
  let(:feedback) { booking.hiring_feedbacks.find_by!(issued_panel_member_id: panel.id) }
  let(:path) { "/api/v1/hiring/interview_feedback/#{feedback.id}" }
  let(:details) do
    { "interview_on" => "2026-11-01", "attendance" => "attended", "topics" => "Rails transactions", "assessment" => "Explained the approach",
      "technical_skills" => "Understands transactions", "communication" => "Clear explanations", "strengths" => "Strong examples",
      "concerns" => "Needs more concurrency experience", "evidence" => "PRIVATE FEEDBACK EVIDENCE", "recommendation" => "pass",
      "answers" => ["PRIVATE QUESTION ANSWER"] }
  end

  around { |example| travel_to(Time.utc(2026, 11, 3, 12)) { example.run } }

  before do
    admin.add_role(:admin, company)
    interviewer.add_role(:employee, company)
    sign_in interviewer
  end

  def payload(**changes)
    feedback
    { company_id: company.id, application_version: application.reload.lock_version, interview_version: round.reload.lock_version,
      booking_version: booking.reload.lock_version, feedback_version: feedback.reload.lock_version,
      request_key: SecureRandom.uuid, details: }.merge(changes)
  end

  def submit(input = payload)
    patch path, params: { hiring_feedback: input }, as: :json
  end

  def end_round(action: "complete")
    Hiring::Interviews.new(application:, actor: admin).update!(record: round, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "interview_version" => round.reload.lock_version,
      "action" => action, "reason" => "Synthetic round outcome"
    })
  end

  it "creates one frozen request per booked panel member and lists missing/overdue feedback" do
    feedback
    expect(booking.hiring_feedbacks.count).to eq(1)
    expect(feedback.panel_snapshot).to include("panel_member_id" => panel.id, "employment_id" => staff.id, "full_name" => interviewer.full_name)
    get "/api/v1/hiring/interview_feedback", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("feedbacks").pluck("id")).to eq([feedback.id])
    expect(response.parsed_body.fetch("feedbacks").first).to include("state" => "overdue")
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("feedback")).to include("can_submit" => true, "details" => nil)
    expect(response.parsed_body.fetch("round").fetch("feedback_questions")).to eq(["Explain the tradeoff"])
    expect(response.body).not_to include("compensation_access", "request_details", "meet.example.test")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
  end

  it "accepts late structured feedback without advancing the application or sending candidate mail" do
    feedback
    version = application.reload.lock_version
    submit
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("feedback")).to include("state" => "submitted", "late" => true, "details" => details, "can_submit" => false)
    expect(feedback.reload.submitted_by).to eq(interviewer)
    expect(application.reload).to have_attributes(stage: "interview", lock_version: version + 1)
    expect(feedback.read_attribute_before_type_cast("details")).not_to include("PRIVATE FEEDBACK", "PRIVATE QUESTION")
    expect(round.events.where(action: "feedback_submitted").count).to eq(1)
    get "/api/v1/hiring/interview_feedback", params: { company_id: company.id }
    expect(response.parsed_body.fetch("feedbacks")).to be_empty
    expect(HiringMessage.count).to eq(0)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "recovers only identical accepted intent and keeps submitted feedback immutable" do
    input = payload(request_key: SecureRandom.uuid.upcase)
    submit(input)
    expect(response).to have_http_status(:ok)
    submit(input)
    expect(response).to have_http_status(:ok)
    expect(round.events.where(action: "feedback_submitted").count).to eq(1)
    submit(input.merge(details: details.merge("evidence" => "Changed intent")))
    expect(response).to have_http_status(:conflict)
    submit(payload)
    expect(response).to have_http_status(:conflict)
    expect { feedback.reload.update!(details: details.merge("recommendation" => "fail")) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "allows the original active interviewer to submit after completion without reopening handover" do
    feedback
    end_round
    get "/api/v1/hiring/interview_reviews/#{round.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.body).not_to include("resume", "assessment", "compensation", "form", "Synthetic round outcome")
    submit
    expect(response).to have_http_status(:ok)
    expect(round.reload.status).to eq("completed")
  end

  it "rejects stale versions while retaining the pending request" do
    [payload(application_version: 999), payload(interview_version: 999), payload(booking_version: 999), payload(feedback_version: 999)].each do |input|
      submit(input)
      expect(response).to have_http_status(:conflict)
    end
    expect(feedback.reload.submitted_at).to be_nil
  end

  it "rejects future/invalid dates, incomplete rubrics, mismatched questions and forged fields" do
    [details.merge("interview_on" => "2026-11-04"), details.merge("interview_on" => "2026-02-30"), details.merge("assessment" => ""),
      details.merge("answers" => []), details.merge("answers" => [false]), details.merge("salary" => "private"),
      details.merge("evidence" => { "unsafe" => true }), details.merge("recommendation" => "hire")].each do |invalid|
      submit(payload(details: invalid))
      expect(response).to have_http_status(:unprocessable_content)
    end
    patch path, params: { hiring_feedback: payload.merge(submitted_by_id: admin.id) }, as: :json
    expect(response).to have_http_status(:bad_request)
    expect(feedback.reload.submitted_at).to be_nil
  end

  it "records no-show evidence without inventing an assessment" do
    no_show = details.merge("attendance" => "no_show", "recommendation" => "hold", "answers" => [""])
    %w[topics assessment technical_skills communication strengths concerns].each { |key| no_show[key] = "" }
    submit(payload(details: no_show.merge("assessment" => "Invented assessment")))
    expect(response).to have_http_status(:unprocessable_content)
    submit(payload(details: no_show))
    expect(response).to have_http_status(:ok)
    expect(application.reload.stage).to eq("interview")
  end

  %w[pass fail additional_round_required].each do |recommendation|
    it "records an explicit #{recommendation} recommendation for a no-show without deciding the outcome" do
      no_show = details.merge("attendance" => "no_show", "recommendation" => recommendation, "answers" => [""])
      HiringFeedback::ASSESSMENT_FIELDS.each { |key| no_show[key] = "" }
      submit(payload(details: no_show))
      expect(response).to have_http_status(:ok)
      expect(feedback.reload.details.fetch("recommendation")).to eq(recommendation)
      expect(application.reload.stage).to eq("interview")
    end
  end

  it "rejects feedback before the booked start and stops cancelled requests" do
    feedback
    travel_to Time.utc(2026, 11, 1, 8)
    submit
    expect(response).to have_http_status(:unprocessable_content)
    travel_to Time.utc(2026, 11, 3, 12)
    end_round(action: "cancel")
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    submit
    expect(response).to have_http_status(:forbidden)
    get "/api/v1/hiring/interview_feedback", params: { company_id: company.id }
    expect(response.parsed_body.fetch("feedbacks")).to be_empty
  end

  it "does not let Admins impersonate interviewers and revokes access after the original employment ends" do
    feedback
    sign_in admin
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    submit
    expect(response).to have_http_status(:forbidden)
    sign_in interviewer
    staff.update!(resigned_at: Date.yesterday)
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    submit
    expect(response).to have_http_status(:forbidden)
  end

  it "enforces the booking tenant FK and denies an inconsistent profile even after unscoped SQL" do
    feedback
    foreign = create(:company)
    expect do
      HiringFeedback.transaction(requires_new: true) { feedback.update_columns(company_id: foreign.id) }
    end.to raise_error(ActiveRecord::InvalidForeignKey)
    other = create(:user, current_workspace: foreign)
    other.add_role(:employee, foreign)
    employment = create(:employment, company: foreign, user: other, resigned_at: nil)
    profile = HiringPanelMember.create!(company: foreign, employment:, details: { "expertise" => "Ruby" })
    feedback.update_columns(hiring_panel_member_id: profile.id)
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    sign_in other
    get path, params: { company_id: foreign.id }
    expect(response).to have_http_status(:not_found)
  end

  it "retains issued author and feedback history when a panel profile is deleted" do
    submit
    expect(response).to have_http_status(:ok)
    name = interviewer.full_name
    panel.destroy!
    expect(feedback.reload.hiring_panel_member_id).to be_nil
    expect(feedback.details).to eq(details)
    sign_in admin
    get "/api/v1/hiring/applications/#{application.id}/interviews/#{round.id}/feedback", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("feedbacks").first).to include("reviewer_name" => name, "details" => details)
  end

  it "backfills older bookings atomically and deduplicates repeat request sweeps" do
    feedback
    booking.hiring_feedbacks.delete_all
    HiringFeedbackRequestsJob.perform_now
    id = booking.hiring_feedbacks.reload.sole.id
    HiringFeedbackRequestsJob.perform_now
    expect(booking.hiring_feedbacks.reload.sole.id).to eq(id)
    expect(HiringMessage.count).to eq(0)
  end

  it "removes feedback with its company without deleting staff users" do
    feedback
    expect { company.destroy! }.not_to raise_error
    expect(HiringFeedback.exists?(feedback.id)).to be(false)
    expect(User.exists?(interviewer.id)).to be(true)
  end

  it "does not grant feedback access when a profile's employment is rebound through unscoped SQL" do
    feedback
    replacement = create(:user, current_workspace: company)
    replacement.add_role(:employee, company)
    employment = create(:employment, company:, user: replacement, resigned_at: nil)
    panel.update_columns(employment_id: employment.id)
    sign_in replacement
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    get "/api/v1/hiring/interview_feedback", params: { company_id: company.id }
    expect(response.parsed_body.fetch("feedbacks")).to be_empty
  end

  it "shares previous submitted feedback with the newly assigned round without sharing Admin notes" do
    submit
    expect(response).to have_http_status(:ok)
    end_round
    application.update!(notes: "PRIVATE ADMIN NOTE")
    next_user = create(:user, current_workspace: company)
    next_user.add_role(:employee, company)
    employment = create(:employment, company:, user: next_user, resigned_at: nil)
    profile = HiringPanelMember.create!(company:, employment:, details: { "expertise" => "Ruby" })
    next_round = Hiring::Interviews.new(application:, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
      "details" => round.details, "panel" => [{ "panel_member_id" => profile.id, "compensation_access" => false }]
    })
    sign_in next_user
    get "/api/v1/hiring/interview_reviews/#{next_round.id}/feedback", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("feedbacks").sole).to include("details" => details, "reviewer_name" => interviewer.full_name)
    expect(response.body).not_to include("PRIVATE ADMIN NOTE", "compensation_access", "request_details")
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{next_round.id}/feedback", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
  end

  it "supports nontechnical rounds without forcing skills, strengths or concerns that were not assessed" do
    submit(payload(details: details.merge("technical_skills" => "", "strengths" => "", "concerns" => "")))
    expect(response).to have_http_status(:ok)
    expect(feedback.reload.details.values_at("technical_skills", "strengths", "concerns")).to eq(["", "", ""])
  end

  it "checks the actual date against the candidate zone rather than the server date" do
    travel_to Time.utc(2026, 11, 3, 20)
    Time.use_zone("UTC") do
      submit(payload(details: details.merge("interview_on" => "2026-11-04")))
      expect(response).to have_http_status(:ok)
      expect(feedback.reload.details.fetch("interview_on")).to eq("2026-11-04")
    end
  end

  it "deduplicates frozen requests when the original profile was removed before backfill" do
    feedback
    name = interviewer.full_name
    booking.hiring_feedbacks.delete_all
    panel.destroy!
    2.times { booking.request_feedback! }
    record = booking.hiring_feedbacks.reload.sole
    expect(record).to have_attributes(issued_panel_member_id: panel.id, hiring_panel_member_id: nil)
    expect(record.panel_snapshot.fetch("full_name")).to eq(name)
    expect(record.state).to eq("unavailable")
    get "/api/v1/hiring/interview_feedback", params: { company_id: company.id }
    expect(response.parsed_body.fetch("feedbacks")).to be_empty
  end

  it "pages Admin history across reschedules and excludes invalidated feedback from the next handover" do
    submit
    expect(response).to have_http_status(:ok)
    current = booking
    20.times do |index|
      current = Hiring::Scheduling.new(interview: round, actor: admin).create!(attributes: {
        "company_id" => company.id, "application_version" => application.reload.lock_version, "interview_version" => round.reload.lock_version,
        "request_key" => SecureRandom.uuid, "starts_local" => "2026-11-02T#{format('%02d', index)}:00", "candidate_time_zone" => "Asia/Kolkata",
        "feedback_hours" => 24, "previous_booking_id" => current.id, "reason" => "Synthetic scheduling revision"
      })
    end
    sign_in admin
    history = "/api/v1/hiring/applications/#{application.id}/interviews/#{round.id}/feedback"
    get history, params: { company_id: company.id }
    first = response.parsed_body.fetch("feedbacks")
    expect(first.size).to eq(20)
    expect(response.parsed_body.dig("pagination", "has_more")).to be(true)
    get history, params: { company_id: company.id, page: 2 }
    second = response.parsed_body.fetch("feedbacks")
    expect(second.pluck("id")).to eq([feedback.id])
    expect(first.pluck("id") & second.pluck("id")).to be_empty
    next_round = Hiring::Interviews.new(application:, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
      "details" => round.details, "panel" => [{ "panel_member_id" => panel.id, "compensation_access" => false }]
    })
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{next_round.id}/feedback", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("feedbacks")).to be_empty
  end

  it "accepts model-valid Unicode answers across all twenty issued questions" do
    round
    Hiring::Interviews.new(application:, actor: admin).update!(record: round, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "interview_version" => round.reload.lock_version,
      "action" => "update", "details" => round.details.merge("feedback_questions" => Array.new(20) { |index| "Question #{index + 1}" }),
      "panel" => [{ "panel_member_id" => panel.id, "compensation_access" => false }]
    })
    text = "界" * 5000
    complete = details.merge(HiringFeedback::ASSESSMENT_FIELDS.index_with(text), "evidence" => text, "answers" => Array.new(20, text))
    submit(payload(details: complete))
    expect(response).to have_http_status(:ok)
    expect(feedback.reload.details.fetch("answers")).to eq(Array.new(20, text))
  end
end
