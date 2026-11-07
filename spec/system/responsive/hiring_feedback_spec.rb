# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Interview feedback journeys", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Feedback QA") }
  let(:admin) { create(:user, first_name: "Synthetic", last_name: "Admin", current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:interviewer) { create(:user, first_name: "Synthetic", last_name: "Reviewer", current_workspace: company) }
  let!(:staff) { create(:employment, company:, user: interviewer, resigned_at: nil) }
  let(:application) do
    result = Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => "Synthetic Feedback Candidate", "email" => "feedback@example.test" }).process
    result.update!(notes: "PRIVATE ADMIN NOTE")
    result
  end
  let(:panel) { HiringPanelMember.create!(company:, employment: staff, details: { "expertise" => "Rails" }) }
  let(:round) do
    Hiring::Interviews.new(application:, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
      "details" => { "title" => "Technical discussion", "kind" => "Technical", "duration_minutes" => 45,
        "criteria" => "Explain concurrency", "preparation" => "Bring a project", "feedback_questions" => ["Explain a tradeoff"] },
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
  let(:feedback) { booking.hiring_feedbacks.sole }

  before do
    admin.add_role(:admin, company)
    interviewer.add_role(:employee, company)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
  end

  around do |example|
    original = Api::V1::Hiring::BaseController.allow_forgery_protection
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    travel_to(Time.utc(2026, 11, 3, 12)) { with_forgery_protection { example.run } }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = original
  end

  def open_feedback(width: 375)
    feedback
    sign_in interviewer
    page.current_window.resize_to(width, 900)
    visit "/interview-feedback"
    expect(page).to have_text("Overdue")
    click_link "Record feedback for Synthetic Feedback Candidate"
    expect(page).to have_text("Explain concurrency")
  end

  def fill_feedback
    fill_in "Actual interview date", with: "2026-11-01"
    select "Attended", from: "Attendance"
    { "Topics covered" => "Rails transactions", "Assessment" => "Explained the approach", "Technical skills" => "Understands transactions",
      "Communication" => "Clear explanations", "Strengths" => "Strong examples", "Concerns" => "More concurrency experience needed",
      "Evidence and examples" => "PRIVATE FEEDBACK EVIDENCE", "Explain a tradeoff" => "Explained locking choices" }.each do |label, value|
      fill_in label, with: value
    end
    select "Pass", from: "Recommendation"
  end

  def complete_round
    Hiring::Interviews.new(application:, actor: admin).update!(record: round, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "interview_version" => round.reload.lock_version,
      "action" => "complete", "reason" => "Synthetic completed interview"
    })
  end

  def screenshot(name)
    return unless ENV["HIRING_FEEDBACK_SHOTS"]

    directory = Rails.root.join(ENV.fetch("HIRING_FEEDBACK_SHOTS"))
    FileUtils.mkdir_p(directory)
    page.save_screenshot(directory.join("#{name}.png"), full: true)
  end

  it "collects late feedback after round completion and shows read-only history to Admin" do
    feedback
    complete_round
    open_feedback
    expect(page).to have_no_text("PRIVATE ADMIN NOTE")
    expect(page).to have_no_link("Open meeting")
    fill_feedback
    click_button "Submit feedback"
    expect(page).to have_text("Feedback submitted")
    expect(page).to have_text("Submitted late")
    expect(page).to have_text("PRIVATE FEEDBACK EVIDENCE")
    expect(page).to have_no_button("Submit feedback")
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    screenshot("feedback-submitted-mobile")
    page.refresh
    expect(page).to have_text("PRIVATE FEEDBACK EVIDENCE")
    sign_out interviewer
    sign_in admin
    page.current_window.resize_to(1440, 1000)
    visit "/hiring/applications/#{application.id}"
    click_button "View interview rounds"
    click_button "View feedback for round 1"
    expect(page).to have_text("PRIVATE FEEDBACK EVIDENCE")
    expect(page).to have_text("Synthetic Reviewer")
    screenshot("feedback-admin-history-desktop")
    expect(@console_errors).to be_empty
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "keeps a stale feedback draft until explicit discard" do
    open_feedback
    fill_feedback
    round.touch
    click_button "Submit feedback"
    expect(page).to have_text("This interview or feedback request changed")
    expect(page).to have_field("Evidence and examples", with: "PRIVATE FEEDBACK EVIDENCE")
    expect(feedback.reload.submitted_at).to be_nil
    screenshot("feedback-stale-draft-mobile")
    click_button "Discard draft and reload feedback"
    expect(page).to have_field("Evidence and examples", with: "")
    fill_feedback
    click_button "Submit feedback"
    expect(page).to have_text("Feedback submitted")
    expect(@console_errors).to be_empty
  end

  it "clears the private draft when its original employment is revoked" do
    open_feedback
    fill_feedback
    staff.update!(resigned_at: Date.yesterday)
    click_button "Submit feedback"
    expect(page).to have_no_field("Evidence and examples")
    expect(page).to have_no_text("PRIVATE FEEDBACK EVIDENCE")
    expect(page).to have_no_text("Synthetic Feedback Candidate")
    expect(feedback.reload.submitted_at).to be_nil
    screenshot("feedback-access-revoked-mobile")
    expect(@console_errors).to be_empty
  end

  it "records a no-show without manufacturing rubric answers" do
    open_feedback
    fill_feedback
    select "No-show", from: "Attendance"
    expect(page).to have_field("No-show date", with: "2026-11-01")
    expect(page).to have_no_field("Technical skills")
    fill_in "Evidence and examples", with: "Candidate did not join; waited and contacted the hiring team"
    select "Fail", from: "Recommendation"
    screenshot("feedback-no-show-mobile")
    click_button "Submit feedback"
    expect(page).to have_text("Feedback submitted")
    expect(feedback.reload.details.values_at(*HiringFeedback::ASSESSMENT_FIELDS)).to all(eq(""))
    expect(page).to have_text("No-show date: 2026-11-01")
    expect(feedback.details.fetch("recommendation")).to eq("fail")
    expect(feedback.details.fetch("answers")).to eq([""])
    expect(application.reload.stage).to eq("interview")
    expect(@console_errors).to be_empty
  end

  it "recovers a lost accepted feedback response without another submission event" do
    lost = false
    allow_any_instance_of(Api::V1::Hiring::InterviewFeedbackController).to receive(:render).and_wrap_original do |original, *args, **options, &block|
      if original.receiver.action_name == "update" && !lost
        lost = true
        original.call(json: { errors: "Synthetic lost response. Retry the same feedback." }, status: 503)
      else
        original.call(*args, **options, &block)
      end
    end
    open_feedback
    fill_feedback
    click_button "Submit feedback"
    expect(page).to have_text("Synthetic lost response. Retry the same feedback.")
    expect(page).to have_field("Evidence and examples", with: "PRIVATE FEEDBACK EVIDENCE")
    click_button "Submit feedback"
    expect(page).to have_text("Feedback submitted")
    expect(round.events.where(action: "feedback_submitted").count).to eq(1)
    expect(@console_errors).to be_empty
  end

  it "shows previous feedback to the next assigned interviewer without Admin-only notes" do
    open_feedback(width: 1440)
    fill_feedback
    click_button "Submit feedback"
    expect(page).to have_text("Feedback submitted")
    complete_round
    next_user = create(:user, first_name: "Synthetic", last_name: "Next", current_workspace: company)
    next_user.add_role(:employee, company)
    employment = create(:employment, company:, user: next_user, resigned_at: nil)
    profile = HiringPanelMember.create!(company:, employment:, details: { "expertise" => "Ruby" })
    next_round = Hiring::Interviews.new(application:, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
      "details" => round.details, "panel" => [{ "panel_member_id" => profile.id, "compensation_access" => false }]
    })
    sign_out interviewer
    sign_in next_user
    visit "/interview-reviews/#{next_round.id}"
    click_button "View previous interview feedback"
    expect(page).to have_text("PRIVATE FEEDBACK EVIDENCE")
    expect(page).to have_no_text("PRIVATE ADMIN NOTE")
    expect(page).to have_no_button("Submit feedback")
    screenshot("feedback-next-interviewer-desktop")
    Hiring::Interviews.new(application:, actor: admin).update!(record: next_round, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "interview_version" => next_round.reload.lock_version, "action" => "update", "details" => next_round.details,
      "panel" => [{ "panel_member_id" => panel.id, "compensation_access" => false }]
    })
    click_button "Refresh previous interview feedback"
    expect(page).to have_no_text("PRIVATE FEEDBACK EVIDENCE")
    expect(page).to have_no_text("Synthetic Feedback Candidate")
    screenshot("feedback-handover-revoked-desktop")
    expect(@console_errors).to be_empty
  end
end
