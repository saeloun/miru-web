# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Interview bookings", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:interviewer) { create(:user, current_workspace: company) }
  let!(:staff) { create(:employment, company:, user: interviewer, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email }).process
  end
  let(:panel_member) { HiringPanelMember.create!(company:, employment: staff, details: { "expertise" => "Rails" }) }
  let(:round) do
    Hiring::Interviews.new(application:, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
      "details" => { "title" => "Technical discussion", "kind" => "Technical", "duration_minutes" => 45,
        "criteria" => "Discuss tests", "preparation" => "Bring a project", "feedback_questions" => ["What did we learn?"] },
      "panel" => [{ "panel_member_id" => panel_member.id, "compensation_access" => false }]
    })
  end
  let(:path) { "/api/v1/hiring/applications/#{application.id}/interviews/#{round.id}/bookings" }

  before do
    admin.add_role(:admin, company)
    interviewer.add_role(:employee, company)
    sign_in admin
  end

  def payload(**changes)
    round
    { company_id: company.id, application_version: application.reload.lock_version, interview_version: round.reload.lock_version,
      request_key: SecureRandom.uuid, starts_local: "2027-01-15T14:30", candidate_time_zone: "Asia/Kolkata", utc_offset: nil,
      meeting_url: "https://meet.example.test/synthetic", booking_instructions: "Contact the hiring team to change the meeting",
      feedback_hours: 24 }.merge(changes)
  end

  def create_booking(attributes = payload)
    post path, params: { hiring_booking: attributes }, as: :json
    expect(response).to have_http_status(:created)
    response.parsed_body.fetch("booking")
  end

  def end_booking(booking, action: "cancel", **changes)
    patch "#{path}/#{booking.fetch('id')}", params: { hiring_booking: {
      company_id: company.id, application_version: application.reload.lock_version, interview_version: round.reload.lock_version,
      booking_version: booking.fetch("lock_version"), action:, reason: "Synthetic scheduling change"
    }.merge(changes) }, as: :json
  end

  it "records a candidate-zone booking, UTC instants, issued round terms and an explicit feedback deadline" do
    record = create_booking
    expect(record).to include("status" => "scheduled", "number" => 1, "starts_at" => "2027-01-15T09:00:00.000Z",
      "ends_at" => "2027-01-15T09:45:00.000Z", "feedback_due_at" => "2027-01-16T09:45:00.000Z")
    expect(record.fetch("details")).to include("candidate_time_zone" => "Asia/Kolkata", "utc_offset" => "+05:30", "source" => "manual")
    expect(record.fetch("round_details")).to eq(round.details)
    encrypted = round.hiring_interview_bookings.sole.read_attribute_before_type_cast("details")
    expect(encrypted).not_to include("meet.example.test", "Contact the hiring team")
    expect(application.reload.stage).to eq("interview")
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("bookings").pluck("id")).to eq([record.fetch("id")])
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(HiringMessage.count).to eq(0)
  end

  it "deduplicates a lost accepted request and rejects changed intent under the same key" do
    attributes = payload
    first = create_booking(attributes)
    post path, params: { hiring_booking: attributes }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("booking", "id")).to eq(first.fetch("id"))
    post path, params: { hiring_booking: attributes.merge(starts_local: "2027-01-15T15:30") }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(round.hiring_interview_bookings.count).to eq(1)
  end

  it "supports an in-person booking without a meeting URL and removes its records with the company" do
    record = create_booking(payload(meeting_url: "", booking_instructions: "Confirm the meeting location with the hiring team"))
    expect(record.fetch("details")).to include("meeting_url" => "")
    expect { company.destroy! }.not_to raise_error
    expect(HiringInterviewBooking.exists?(record.fetch("id"))).to be(false)
    expect(User.exists?(interviewer.id)).to be(true)
  end

  it "requires a choice for DST overlap and never normalizes a nonexistent local time" do
    post path, params: { hiring_booking: payload(starts_local: "2027-03-14T02:30", candidate_time_zone: "America/New_York") }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    post path, params: { hiring_booking: payload(starts_local: "2027-11-07T01:30", candidate_time_zone: "America/New_York") }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.fetch("offset_options")).to contain_exactly("-04:00", "-05:00")
    record = create_booking(payload(starts_local: "2027-11-07T01:30", candidate_time_zone: "America/New_York", utc_offset: "-05:00"))
    expect(record.fetch("starts_at")).to eq("2027-11-07T06:30:00.000Z")
  end

  it "reschedules into a new immutable snapshot and retains the cancelled booking and reason" do
    original = create_booking
    record = create_booking(payload(previous_booking_id: original.fetch("id"), reason: "Candidate requested another day", starts_local: "2027-01-16T14:30"))
    first = round.hiring_interview_bookings.find(original.fetch("id"))
    expect(first).to have_attributes(status: "cancelled", ending_reason: "Candidate requested another day", starts_at: Time.utc(2027, 1, 15, 9))
    expect(record).to include("number" => 2, "status" => "scheduled", "starts_at" => "2027-01-16T09:00:00.000Z")
    expect { first.update!(starts_at: Time.current) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(round.events.order(:id).last.action).to eq("rescheduled")
  end

  it "cancels with a reason, rejects stale endings and records a no-show only after the scheduled start" do
    first = create_booking
    end_booking(first, reason: "")
    expect(response).to have_http_status(:unprocessable_content)
    end_booking(first, booking_version: 999)
    expect(response).to have_http_status(:conflict)
    end_booking(first, action: "no_show")
    expect(response).to have_http_status(:unprocessable_content)
    travel_to Time.utc(2027, 1, 15, 10) do
      end_booking(first, action: "no_show")
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("booking", "status")).to eq("no_show")
    end
    second = create_booking(payload(starts_local: "2027-01-16T14:30"))
    end_booking(second, reason: "Candidate cancelled")
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("booking", "status")).to eq("cancelled")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "rolls back cancellation when the replacement booking is invalid" do
    original = create_booking
    version = round.reload.lock_version
    post path, params: { hiring_booking: payload(previous_booking_id: original.fetch("id"), reason: "Change requested", meeting_url: "javascript:bad") }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(round.hiring_interview_bookings.sole).to have_attributes(status: "scheduled", lock_version: 0, ending_reason: nil)
    expect(round.reload.lock_version).to eq(version)
    expect(round.events.where(action: "rescheduled")).to be_empty
  end

  it "shares only the assigned staff booking projection and removes cancelled meeting access" do
    record = create_booking
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{round.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("handover", "booking", "details", "meeting_url")).to eq("https://meet.example.test/synthetic")
    expect(response.parsed_body.fetch("handover").fetch("booking").keys).to contain_exactly("id", "status", "starts_at", "ends_at", "feedback_due_at", "details")
    sign_in admin
    end_booking(record, reason: "PRIVATE ADMIN CANCELLATION REASON")
    expect(response).to have_http_status(:ok)
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{round.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("handover", "booking", "status")).to eq("cancelled")
    expect(response.body).not_to include("https://meet.example.test/synthetic", "PRIVATE ADMIN CANCELLATION REASON", "request_key", "round_details")
  end

  it "scopes application and booking identities and enforces the tenant foreign key" do
    record = create_booking
    foreign = create(:company)
    expect do
      HiringInterviewBooking.transaction(requires_new: true) do
        round.hiring_interview_bookings.find(record.fetch("id")).update_columns(company_id: foreign.id)
      end
    end.to raise_error(ActiveRecord::InvalidForeignKey)
    foreign_admin = create(:user, current_workspace: foreign)
    foreign_admin.add_role(:admin, foreign)
    create(:employment, company: foreign, user: foreign_admin, resigned_at: nil)
    foreign_application = Hiring::Intake.new(company: foreign, actor: foreign_admin, attributes: {
      "company_id" => foreign.id, "request_key" => SecureRandom.uuid, "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email
    }).process
    get "/api/v1/hiring/applications/#{foreign_application.id}/interviews/#{round.id}/bookings", params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include("meet.example.test")
    sign_in foreign_admin
    get path, params: { company_id: foreign.id }
    expect(response).to have_http_status(:not_found)
  end

  it "denies staff writes and mismatched workspaces, versions, URLs and missing deadline policy" do
    [payload(application_version: 999), payload(interview_version: 999), payload(company_id: company.id + 1)].each do |attributes|
      post path, params: { hiring_booking: attributes }, as: :json
      expect(response).to have_http_status(:conflict)
    end
    [payload(meeting_url: "javascript:alert(1)"), payload(meeting_url: "https://user:secret@example.test"),
      payload(feedback_hours: nil), payload(feedback_hours: "24"), payload(feedback_hours: 0), payload(reason: { "unsafe" => true })].each do |attributes|
      post path, params: { hiring_booking: attributes }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
    sign_in interviewer
    post path, params: { hiring_booking: payload }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "rejects a booking when an assigned panel member's access was revoked" do
    attributes = payload
    round.hiring_access_grants.active.update_all(revoked_at: Time.current)
    post path, params: { hiring_booking: attributes }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(round.hiring_interview_bookings).to be_empty
  end

  it "cancels the booking when another active interviewer replaces the panel" do
    original = create_booking
    replacement_user = create(:user, current_workspace: company)
    replacement_user.add_role(:employee, company)
    employment = create(:employment, company:, user: replacement_user, resigned_at: nil)
    replacement = HiringPanelMember.create!(company:, employment:, details: { "expertise" => "Ruby" })
    Hiring::Interviews.new(application:, actor: admin).update!(record: round, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "interview_version" => round.reload.lock_version, "action" => "update", "details" => round.details,
      "panel" => [{ "panel_member_id" => replacement.id, "compensation_access" => false }]
    })
    expect(round.hiring_interview_bookings.find(original.fetch("id")).status).to eq("cancelled")
    expect(round.hiring_access_grants.active.pluck(:hiring_panel_member_id)).to eq([replacement.id])
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{round.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
  end

  it "closes a booking when round terms change and never revives it by returning to interview" do
    original = create_booking
    Hiring::Interviews.new(application:, actor: admin).update!(record: round, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "interview_version" => round.reload.lock_version, "action" => "update", "details" => round.details,
      "panel" => [{ "panel_member_id" => panel_member.id, "compensation_access" => true }]
    })
    expect(round.hiring_interview_bookings.find(original.fetch("id")).status).to eq("scheduled")
    Hiring::Interviews.new(application:, actor: admin).update!(record: round, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "interview_version" => round.reload.lock_version, "action" => "update",
      "details" => round.details.merge("preparation" => "Bring a different example"),
      "panel" => [{ "panel_member_id" => panel_member.id, "compensation_access" => false }]
    })
    expect(round.hiring_interview_bookings.find(original.fetch("id")).status).to eq("cancelled")
    next_booking = create_booking
    Hiring::Screening.new(application:, actor: admin, attributes: { "company_id" => company.id, "lock_version" => application.reload.lock_version,
      "action" => "request_information", "reason" => "Confirm the candidate's availability" }).process
    expect(round.reload.status).to eq("cancelled")
    expect(round.hiring_interview_bookings.find(next_booking.fetch("id")).status).to eq("cancelled")
  end
end
