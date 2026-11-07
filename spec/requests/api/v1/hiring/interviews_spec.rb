# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring interview rounds", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:interviewer) { create(:user, current_workspace: company) }
  let!(:staff) { create(:employment, company:, user: interviewer, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "request_key" => SecureRandom.uuid, "full_name" => Faker::Name.name,
      "email" => Faker::Internet.unique.email, "notes" => "PRIVATE ADMIN MARKER"
    }).process
  end
  let(:panel_member) do
    HiringPanelMember.create!(company:, employment: staff,
      details: { "expertise" => "Rails", "availability" => "Weekdays", "booking_url" => "https://calendar.example.test/synthetic" })
  end
  let(:details) do
    { "title" => "Admin screening call", "kind" => "Screening", "duration_minutes" => 30,
      "criteria" => "Relevant experience", "preparation" => "Bring a project example",
      "feedback_questions" => ["What evidence supports the assessment?"] }
  end

  before do
    admin.add_role(:admin, company)
    interviewer.add_role(:employee, company)
    sign_in admin
  end

  def new_round(**changes)
    { company_id: company.id, application_version: application.reload.lock_version, request_key: SecureRandom.uuid,
      details:, panel: [{ panel_member_id: panel_member.id, compensation_access: false }] }.merge(changes)
  end

  def create_round(attributes = new_round)
    post "/api/v1/hiring/applications/#{application.id}/interviews", params: { hiring_interview: attributes }, as: :json
    expect(response).to have_http_status(:created)
    response.parsed_body.fetch("interview")
  end

  def change_round(round, action: "update", **changes)
    patch "/api/v1/hiring/applications/#{application.id}/interviews/#{round.fetch('id')}", params: {
      hiring_interview: { company_id: company.id, application_version: application.reload.lock_version,
        interview_version: round.fetch("lock_version"), action:, details:,
        panel: [{ panel_member_id: panel_member.id, compensation_access: false }] }.merge(changes)
    }, as: :json
  end

  def submitted_form
    schema = Hiring::Form.default_schema.merge("enabled" => true)
    schema["fields"] = schema.fetch("fields").map { |field| field.merge("required" => false) }
    schema["fields"] << { "id" => "custom_reference", "label" => "Private reference", "type" => "textarea", "required" => false, "sensitive" => true }
    setting = HiringSetting.create!(company:, form_schema: schema,
      details: HiringSetting::TEXT_FIELDS.index_with { |field| "Synthetic #{field}" }.merge("client_count" => 0))
    access = HiringPortalAccess.create!(company:, hiring_application: application, hiring_setting: setting,
      issued_by: admin, approved_setting_version: setting.lock_version, form_schema: schema,
      introduction: "Synthetic approved introduction", expires_at: 1.day.from_now)
    HiringSubmission.create!(company:, hiring_application: application, hiring_portal_access: access,
      submitted_at: Time.current, answers: { "full_name" => application.submitted_name, "skills" => "Ruby",
        "current_compensation" => { "amount" => "987654.32", "currency" => "INR", "period" => "monthly" },
        "custom_reference" => "PRIVATE REFERENCE MARKER" })
  end

  it "adds a screening call and arbitrary later rounds without sending candidate mail" do
    first = create_round
    expect(first).to include("number" => 1, "status" => "planned", "details" => details, "lock_version" => 0)
    expect(first.fetch("panel").sole).to include("panel_member_id" => panel_member.id, "compensation_access" => false)
    expect(application.reload).to have_attributes(stage: "interview", lock_version: 1)
    second = create_round(new_round(details: details.merge("title" => "Round 7", "kind" => "Architecture", "duration_minutes" => 75)))
    expect(second).to include("number" => 2)
    get "/api/v1/hiring/applications/#{application.id}/interviews", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("interviews").pluck("id")).to eq([second.fetch("id"), first.fetch("id")])
    expect(HiringMessage.count).to eq(0)
  end

  it "deduplicates a lost accepted creation response and rejects a changed request with the same key" do
    payload = new_round
    first = create_round(payload)
    post "/api/v1/hiring/applications/#{application.id}/interviews", params: { hiring_interview: payload }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("interview", "id")).to eq(first.fetch("id"))
    expect(application.reload.lock_version).to eq(1)
    post "/api/v1/hiring/applications/#{application.id}/interviews", params: {
      hiring_interview: payload.merge(details: details.merge("title" => "Changed intent"))
    }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(HiringInterview.count).to eq(1)
  end

  it "excludes compensation and Admin notes until a specific active interviewer is granted compensation access" do
    submitted_form
    round = create_round
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("handover", "form", "answers")).to include("skills" => "Ruby")
    expect(response.body).not_to include("987654.32", "PRIVATE ADMIN MARKER", "PRIVATE REFERENCE MARKER")
    expect(response.body).not_to include("compensation_access")

    sign_in admin
    change_round(round, panel: [{ panel_member_id: panel_member.id, compensation_access: true }])
    expect(response).to have_http_status(:ok)
    round = response.parsed_body.fetch("interview")
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("handover", "form", "answers", "current_compensation", "amount")).to eq("987654.32")
    expect(response.body).not_to include("PRIVATE ADMIN MARKER", "PRIVATE REFERENCE MARKER")
  end

  it "revokes the old panel on reassignment and checks current membership on every review" do
    round = create_round
    change_round(round, panel: [{ panel_member_id: panel_member.id, compensation_access: true }])
    expect(response).to have_http_status(:ok)
    round = response.parsed_body.fetch("interview")
    other = create(:user, current_workspace: company)
    other.add_role(:employee, company)
    replacement = create(:employment, company:, user: other, resigned_at: nil)
    profile = HiringPanelMember.create!(company:, employment: replacement, details: {})
    change_round(round, panel: [{ panel_member_id: profile.id, compensation_access: false }])
    expect(response).to have_http_status(:ok)
    expect(HiringAccessGrant.where(hiring_interview_id: round.fetch("id"), revoked_at: nil).pluck(:hiring_panel_member_id)).to eq([profile.id])

    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    sign_in other
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    replacement.update!(resigned_at: Date.yesterday)
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
  end

  it "preserves completed rounds, repeats into a new round and records skipping separately" do
    round = create_round
    change_round(round, action: "complete", reason: "Screening finished")
    expect(response).to have_http_status(:ok)
    completed = response.parsed_body.fetch("interview")
    expect(completed.fetch("status")).to eq("completed")
    frozen = HiringInterview.find(round.fetch("id")).attributes
    change_round(completed, details: details.merge("title" => "Rewrite history"))
    expect(response).to have_http_status(:unprocessable_content)
    expect(HiringInterview.find(round.fetch("id")).attributes).to eq(frozen)
    repeated = create_round(new_round(previous_interview_id: round.fetch("id")))
    expect(repeated).to include("number" => 2, "previous_interview_id" => round.fetch("id"))
    change_round(repeated, action: "skip", reason: "Skip with recorded reason")
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("interview", "status")).to eq("skipped")
    expect(HiringAccessGrant.where(hiring_interview_id: repeated.fetch("id"), revoked_at: nil)).to be_empty
    event = HiringInterview.find(round.fetch("id")).events.order(:id).last
    expect { event.update!(details: {}) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects stale versions, foreign panels, invalid details and nonboolean compensation grants" do
    round = create_round
    change_round(round, interview_version: 100)
    expect(response).to have_http_status(:conflict)
    change_round(round, application_version: 100)
    expect(response).to have_http_status(:conflict)
    foreign_company = create(:company)
    foreign_user = create(:user)
    foreign_user.add_role(:employee, foreign_company)
    foreign_staff = create(:employment, company: foreign_company, user: foreign_user, resigned_at: nil)
    foreign = HiringPanelMember.create!(company: foreign_company, employment: foreign_staff, details: {})
    [[], [{ panel_member_id: foreign.id, compensation_access: false }], [{ panel_member_id: panel_member.id, compensation_access: "true" }]].each do |panel|
      change_round(round, panel:)
      expect(response).to have_http_status(:unprocessable_content)
    end
    [0, -1, 1_000_000, "30", true].each do |duration|
      change_round(round, details: details.merge("duration_minutes" => duration))
      expect(response).to have_http_status(:unprocessable_content)
    end
    expect(HiringInterview.find(round.fetch("id")).lock_version).to eq(0)
  end

  it "lists only the current interviewer's assigned rounds" do
    round = create_round
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("interviews").pluck("id")).to eq([round.fetch("id")])
    expect(response.body).not_to include("PRIVATE ADMIN MARKER", "compensation_access")
    outsider = create(:user, current_workspace: company)
    outsider.add_role(:employee, company)
    create(:employment, company:, user: outsider, resigned_at: nil)
    sign_in outsider
    get "/api/v1/hiring/interview_reviews", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("interviews")).to be_empty
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
  end

  it "serves private resume bytes and rechecks interviewer access after storage reads" do
    submission = submitted_form
    bytes = File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf"))
    submission.resume.attach(io: StringIO.new(bytes), filename: "synthetic-resume.pdf", content_type: "application/pdf",
      metadata: { "hiring_sha256" => Digest::SHA256.hexdigest(bytes) })
    round = create_round
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}/resume", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.body).to eq(bytes)
    expect(response.headers["Content-Security-Policy"]).to include("sandbox")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")

    allow_any_instance_of(HiringSubmission).to receive(:resume_bytes).and_wrap_original do |original|
      data = original.call
      staff.update!(resigned_at: Date.yesterday)
      data
    end
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}/resume", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include(bytes)
  end

  it "ends and revokes a planned round when screening moves the application out of interviews" do
    round = create_round
    post "/api/v1/hiring/applications/#{application.id}/screenings", params: {
      screening: { company_id: company.id, lock_version: application.reload.lock_version,
        action: "request_information", reason: "Clarify the application before interviewing" }
    }, as: :json
    expect(response).to have_http_status(:created)
    expect(HiringInterview.find(round.fetch("id")).status).to eq("cancelled")
    expect(HiringAccessGrant.active.where(hiring_interview_id: round.fetch("id"))).to be_empty

    post "/api/v1/hiring/applications/#{application.id}/screenings", params: {
      screening: { company_id: company.id, lock_version: application.reload.lock_version, action: "interview" }
    }, as: :json
    expect(response).to have_http_status(:created)
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
  end

  it "deletes repeated round data with its company without deleting staff users" do
    original = create_round
    change_round(original, action: "complete", reason: "Screening completed")
    expect(response).to have_http_status(:ok)
    create_round(new_round(previous_interview_id: original.fetch("id")))
    expect { company.destroy! }.not_to raise_error
    expect(HiringInterview.where(company_id: company.id)).to be_empty
    expect(HiringAccessGrant.where(company_id: company.id)).to be_empty
    expect(HiringInterviewEvent.where(company_id: company.id)).to be_empty
    expect(User.exists?(interviewer.id)).to be(true)
  end

  it "hands over submitted assessment work without executing it and downloads only its private file" do
    library = Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "title" => "Synthetic review task", "details" => {
        "instructions" => "Explain the solution", "criteria" => "Review tests and tradeoffs", "expected_minutes" => 60,
        "submission_method" => "files", "ai_policy" => "Disclose assistance"
      }
    }).process
    Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "lock_version" => library.lock_version
    }).process(template: library, action: "approve")
    bytes = "raise 'untrusted candidate code must never run'"
    older, assessment = 2.times.map do |index|
      record = Hiring::Assignments.new(application:, actor: admin).issue!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "template_id" => library.id, "template_version" => library.lock_version, "reviewer_employment_id" => staff.id,
      "due_at" => 2.days.from_now.iso8601, "request_key" => SecureRandom.uuid
    })
      Tempfile.create(["synthetic-work", ".rb"]) do |file|
        file.write(bytes)
        file.flush
        Hiring::Assignments.new(application:, actor: nil).upload!(assignment: record, token: record.access_token, attributes: {
          "assignment_version" => record.reload.lock_version, "submission_version" => record.submission.reload.lock_version,
          "file" => ActionDispatch::Http::UploadedFile.new(tempfile: file, filename: "untrusted.rb", type: "application/octet-stream")
        })
      end
      Hiring::Assignments.new(application:, actor: nil).submit!(assignment: record, token: record.access_token, attributes: {
        "assignment_version" => record.reload.lock_version, "submission_version" => record.submission.reload.lock_version,
        "answers" => { "setup" => "Inspect without execution", "approach" => "Synthetic submission",
          "own_contribution" => "I understand this example", "ai_used" => false }
      })
      if index.zero?
        Hiring::Assignments.new(application:, actor: admin).decide!(assignment: record, attributes: {
          "company_id" => company.id, "application_version" => application.reload.lock_version,
          "assignment_version" => record.reload.lock_version, "action" => "cancel", "reason" => "Replace the earlier task"
        })
      end
      record.reload
    end
    round = create_round
    attachment = assessment.submission.files_attachments.sole
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("handover", "assessment", "id")).to eq(assessment.id)
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}/assignments/#{assessment.id}/files/#{attachment.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.body).to eq(bytes)
    expect(response.headers["Content-Type"]).to include("application/octet-stream")
    expect(response.headers["Content-Security-Policy"]).to include("sandbox")
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}/assignments/#{older.id}/files/#{older.submission.files_attachments.sole.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include(bytes)
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}/assignments/#{assessment.id + 1}/files/#{attachment.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include(bytes)
    allow_any_instance_of(HiringAssignmentSubmission).to receive(:file_bytes).and_wrap_original do |original, file|
      data = original.call(file)
      staff.update!(resigned_at: Date.yesterday)
      data
    end
    get "/api/v1/hiring/interview_reviews/#{round.fetch('id')}/assignments/#{assessment.id}/files/#{attachment.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include(bytes)
  end
end
