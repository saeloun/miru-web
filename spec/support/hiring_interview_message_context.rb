# frozen_string_literal: true

RSpec.shared_context "interview message records" do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:interviewer) { create(:user, current_workspace: company) }
  let!(:staff) { create(:employment, company:, user: interviewer, resigned_at: nil) }
  let(:candidate_name) { Faker::Name.name }
  let(:application) do
    record = Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => candidate_name, "email" => "candidate@example.test" }).process
    record.update!(notes: "PRIVATE ADMIN NOTE")
    record
  end
  let(:panel) { HiringPanelMember.create!(company:, employment: staff, details: { "expertise" => "PRIVATE EXPERTISE" }) }
  let(:round) do
    Hiring::Interviews.new(application:, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
      "details" => { "title" => "Project discussion", "kind" => "Technical", "duration_minutes" => 45,
        "criteria" => "PRIVATE CRITERIA", "preparation" => "Bring a project", "feedback_questions" => ["PRIVATE QUESTION"] },
      "panel" => [{ "panel_member_id" => panel.id, "compensation_access" => false }]
    })
  end
  let(:booking) do
    Hiring::Scheduling.new(interview: round, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "interview_version" => round.reload.lock_version,
      "request_key" => SecureRandom.uuid, "starts_local" => "2026-11-09T14:30", "candidate_time_zone" => "Asia/Kolkata",
      "feedback_hours" => 24, "meeting_url" => "https://meet.example.test/synthetic", "booking_instructions" => "Contact the hiring team to reschedule"
    })
  end
  let(:path) { "/api/v1/hiring/applications/#{application.id}/interviews/#{round.id}/bookings/#{booking.id}/messages" }
  let(:mailbox) { HiringMailbox.create!(company:, name: "Hiring", source_email: "hiring@example.test") }

  def approve
    details = HiringSetting::TEXT_FIELDS.index_with { |field| "Approved #{field}" }.merge("client_count" => 5)
    HiringMessage::INTERVIEW_KINDS.each do |kind|
      details["#{kind}_subject"] = "Approved #{kind}"
      details["#{kind}_body"] = "Please review these interview details."
    end
    configuration = Hiring::Configure.new(company:, actor: admin)
    setting = configuration.save_draft!(details:, lock_version: company.hiring_setting&.lock_version)
    configuration.approve!(lock_version: setting.lock_version)
  end

  before do
    admin.add_role(:admin, company)
    interviewer.add_role(:employee, company)
  end

  around { |example| travel_to(Time.utc(2026, 11, 3, 12)) { example.run } }
end
