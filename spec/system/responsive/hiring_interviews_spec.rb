# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Interview panels and private handover", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Interview QA") }
  let(:admin) { create(:user, first_name: "Synthetic", last_name: "Admin", current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:interviewer) { create(:user, first_name: "Synthetic", last_name: "Interviewer", current_workspace: company) }
  let!(:staff) { create(:employment, company:, user: interviewer, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => "Synthetic Interview Candidate", "email" => "interview@example.test", "notes" => "PRIVATE ADMIN NOTES" }).process
  end
  let(:profile) do
    HiringPanelMember.create!(company:, employment: staff, details: { "expertise" => "Rails", "availability" => "Weekdays",
      "booking_url" => "https://calendar.example.test/interviewer" })
  end
  let(:round_details) do
    { "title" => "Rails architecture", "kind" => "Technical", "duration_minutes" => 60,
      "criteria" => "Explain query design", "preparation" => "Bring a project example", "feedback_questions" => ["What evidence supports your recommendation?"] }
  end

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
    with_forgery_protection { example.run }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = original
  end

  def open_admin(path, width: 1440)
    sign_in admin
    page.current_window.resize_to(width, 900)
    visit path
    if path.start_with?("/hiring/applications/")
      expect(page).to have_button("Reload screening", disabled: false)
      expect(page).to have_button("Reload saved state", disabled: false)
      click_button "View interview rounds"
    end
  end

  def record_round(compensation: false)
    Hiring::Interviews.new(application:, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
      "details" => round_details, "panel" => [{ "panel_member_id" => profile.id, "compensation_access" => compensation }]
    })
  end

  def screenshot(name)
    return unless ENV["HIRING_INTERVIEW_SHOTS"]

    directory = Rails.root.join(ENV.fetch("HIRING_INTERVIEW_SHOTS"))
    FileUtils.mkdir_p(directory)
    page.save_screenshot(directory.join("#{name}.png"), full: true)
  end

  def submitted_work(bytes)
    library = Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "title" => "Synthetic handover task", "details" => {
        "instructions" => "Explain the query", "criteria" => "Evidence from tests", "expected_minutes" => 60,
        "submission_method" => "files", "ai_policy" => "Disclose assistance"
      }
    }).process
    Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "lock_version" => library.lock_version
    }).process(template: library, action: "approve")
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
      "answers" => { "setup" => "Review without execution", "approach" => "Synthetic explanation",
        "own_contribution" => "I can explain the query and tests", "ai_used" => false }
    })
    record.reload
  end

  it "adds and edits the interviewer profile on mobile with a safe booking link" do
    open_admin("/hiring/panel", width: 375)
    expect(page).to have_css("h2", text: "Interview panel", exact_text: true)
    expect(find_button("Add panel member").evaluate_script("this.getBoundingClientRect().height")).to be >= 44
    find_button("Add panel member").send_keys(:enter)
    find("#panel-employment").click
    find("[cmdk-item]", text: interviewer.full_name).click
    fill_in "Expertise", with: "Rails and PostgreSQL"
    fill_in "Availability", with: "Weekdays, India time"
    fill_in "Booking URL", with: "https://calendar.example.test/interviewer"
    expect(find_button("Save panel member").evaluate_script("this.getBoundingClientRect().height")).to be >= 44
    click_button "Save panel member"
    expect(page).to have_text("Panel member saved")
    expect(page).to have_text("Rails and PostgreSQL")
    click_button "Edit #{interviewer.full_name}"
    fill_in "Availability", with: "Tuesday and Thursday"
    click_button "Save panel member"
    expect(page).to have_text("Tuesday and Thursday")
    expect(company.hiring_panel_members.sole.details.fetch("availability")).to eq("Tuesday and Thursday")
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    expect(@console_errors).to be_empty
    screenshot("panel-mobile")
  end

  it "loads round history only when the admin opens it" do
    reads = []
    allow_any_instance_of(Api::V1::Hiring::InterviewsController).to receive(:index).and_wrap_original do |original|
      reads << true
      original.call
    end
    sign_in admin
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    expect(page).to have_button("View interview rounds")
    expect(reads).to be_empty
    click_button "View interview rounds"
    within('section[aria-label="Interview rounds"]') { expect(page).to have_text("No interview rounds yet") }
    expect(reads.size).to eq(1)
    expect(@console_errors).to be_empty
  end

  it "creates, completes, repeats and skips arbitrary rounds without rewriting the completed round" do
    profile
    open_admin("/hiring/applications/#{application.id}", width: 375)
    within('section[aria-label="Interview rounds"]') do
      click_button "Add interview round"
      fill_in "Round title", with: "Rails architecture"
      fill_in "Round type", with: "Technical"
      fill_in "Duration (minutes)", with: "60"
      fill_in "Assessment criteria", with: "Explain query design"
      fill_in "Candidate preparation", with: "Bring a project example"
      fill_in "Feedback questions (one per line)", with: "What evidence supports your recommendation?"
      find("#round-panel").click
    end
    find("[cmdk-item]", text: interviewer.full_name).click
    within('section[aria-label="Interview rounds"]') do
      click_button "Save interview round"
      expect(page).to have_text("Interview round saved")
      click_button "Complete round 1"
      fill_in "Reason", with: "Discussion completed; feedback follows separately"
      click_button "Confirm complete"
      expect(page).to have_text("Completed")
      screenshot("completed-round-mobile")
      click_button "Repeat round 1"
      fill_in "Round title", with: "Second technical discussion"
      click_button "Save interview round"
      expect(page).to have_text("Second technical discussion")
      click_button "Skip round 2"
      fill_in "Reason", with: "No further technical discussion needed"
      click_button "Confirm skip"
      expect(page).to have_text("Skipped")
    end
    first, second = application.hiring_interviews.order(:number).to_a
    expect(first).to have_attributes(status: "completed", details: round_details)
    expect(second).to have_attributes(status: "skipped", previous_interview_id: first.id)
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    expect(@console_errors).to be_empty
  end

  it "preserves a stale profile draft and clears private details after admin access is revoked" do
    profile
    open_admin("/hiring/panel")
    click_button "Edit #{interviewer.full_name}"
    fill_in "Expertise", with: "Unsaved private expertise"
    profile.update!(details: { "expertise" => "Updated by another admin" })
    click_button "Save panel member"
    expect(page).to have_css('[role="alert"]', text: "changed")
    expect(page).to have_field("Expertise", with: "Unsaved private expertise")
    click_button "Discard draft and reload panel"
    expect(page).not_to have_field("Expertise")
    expect(page).to have_text("Updated by another admin")
    click_button "Edit #{interviewer.full_name}"
    fill_in "Expertise", with: "Private draft after revocation"
    membership.update!(resigned_at: Date.yesterday)
    click_button "Save panel member"
    expect(page).to have_css('[role="alert"]')
    expect(page).not_to have_field("Expertise")
    expect(page).not_to have_text(interviewer.full_name)
    expect(page).not_to have_text("Updated by another admin")
    expect(@console_errors).to be_empty
  end

  it "keeps a stale draft until the admin explicitly discards it and reloads" do
    profile
    open_admin("/hiring/applications/#{application.id}")
    within('section[aria-label="Interview rounds"]') do
      click_button "Add interview round"
      fill_in "Round title", with: "Unsaved technical discussion"
      fill_in "Round type", with: "Technical"
      fill_in "Assessment criteria", with: "Review experience"
      fill_in "Feedback questions (one per line)", with: "What did we learn?"
      find("#round-panel").click
    end
    find("[cmdk-item]", text: interviewer.full_name).click
    application.reload.update!(stage: "screening")
    within('section[aria-label="Interview rounds"]') do
      click_button "Save interview round"
      expect(page).to have_css('[role="alert"]', text: "changed")
      expect(page).to have_field("Round title", with: "Unsaved technical discussion")
      click_button "Discard draft and reload rounds"
      expect(page).not_to have_field("Round title")
      expect(page).to have_text("No interview rounds yet")
    end
    expect(application.hiring_interviews).to be_empty
    expect(@console_errors).to be_empty
  end

  it "shows only assigned handover, honors explicit compensation access and clears data when membership ends" do
    schema = Hiring::Form.default_schema.merge("enabled" => true)
    schema["fields"] = schema.fetch("fields").map { |field| field.merge("required" => false) }
    setting = HiringSetting.create!(company:, form_schema: schema,
      details: HiringSetting::TEXT_FIELDS.index_with { |field| "Synthetic #{field}" }.merge("client_count" => 0))
    access = HiringPortalAccess.create!(company:, hiring_application: application, hiring_setting: setting, issued_by: admin,
      approved_setting_version: setting.lock_version, form_schema: schema, introduction: "Synthetic introduction", expires_at: 1.day.from_now)
    submission = HiringSubmission.create!(company:, hiring_application: application, hiring_portal_access: access, submitted_at: Time.current,
      answers: { "full_name" => application.submitted_name, "skills" => "Ruby and PostgreSQL", "current_compensation" => {
        "amount" => "987654.32", "currency" => "INR", "period" => "monthly" } })
    bytes = File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf"))
    filename = "synthetic-#{'resume-' * 12}.pdf"
    submission.resume.attach(io: StringIO.new(bytes), filename:, content_type: "application/pdf",
      metadata: { "hiring_sha256" => Digest::SHA256.hexdigest(bytes) })
    round = record_round
    sign_in interviewer
    page.current_window.resize_to(375, 900)
    visit "/interview-reviews"
    click_link "Synthetic Interview Candidate · Rails architecture"
    expect(page).to have_css("h1", text: "Interview handover", exact_text: true)
    expect(page).to have_text("Ruby and PostgreSQL")
    expect(page).not_to have_text("987654.32")
    expect(page).not_to have_text("PRIVATE ADMIN NOTES")
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    Dir.mktmpdir("miru-interview-download") do |directory|
      expect(page.evaluate_script(<<~JS)).to be(true)
        Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Download resume:'))
          .getBoundingClientRect().right <= window.innerWidth
      JS
      downloads = page.driver.browser.downloads
      downloads.set_behavior(save_path: directory)
      expect(downloads.wait(10) { click_button "Download resume: #{filename}", exact: true }).to be(true)
      expect(File.binread(File.join(directory, filename))).to eq(bytes)
    end
    Hiring::Interviews.new(application:, actor: admin).update!(record: round, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "interview_version" => round.reload.lock_version,
      "action" => "update", "details" => round_details, "panel" => [{ "panel_member_id" => profile.id, "compensation_access" => true }]
    })
    click_button "Refresh handover"
    expect(page).to have_text("987654.32 INR")
    screenshot("handover-compensation-granted")
    staff.update!(resigned_at: Date.yesterday)
    click_button "Refresh handover"
    expect(page).to have_css('[role="alert"]')
    expect(page).not_to have_text("987654.32")
    expect(page).not_to have_text("Ruby and PostgreSQL")
    expect(page).not_to have_text("Synthetic Interview Candidate")
    expect(@console_errors).to be_empty
    screenshot("handover-membership-revoked")
  end

  it "reassigns a planned round and explicitly grants compensation from the admin screen" do
    round = record_round
    replacement = create(:user, first_name: "Replacement", last_name: "Interviewer", current_workspace: company)
    replacement.add_role(:employee, company)
    replacement_staff = create(:employment, company:, user: replacement, resigned_at: nil)
    replacement_profile = HiringPanelMember.create!(company:, employment: replacement_staff, details: { "expertise" => "PostgreSQL" })
    original_event = round.events.sole.details
    open_admin("/hiring/applications/#{application.id}")
    within('section[aria-label="Interview rounds"]') do
      click_button "Edit round 1"
      click_button "Remove #{interviewer.full_name}"
      find("#round-panel").click
    end
    find("[cmdk-item]", text: replacement.full_name).click
    within('section[aria-label="Interview rounds"]') do
      check "Allow compensation access for #{replacement.full_name}"
      click_button "Save interview round"
      expect(page).to have_text("Interview round saved")
      expect(page).to have_text("#{replacement.full_name} · Compensation allowed")
      expect(page).not_to have_text("#{interviewer.full_name} · Compensation")
    end
    expect(round.hiring_access_grants.active.sole).to have_attributes(hiring_panel_member_id: replacement_profile.id, compensation_access: true)
    expect(round.events.order(:id).first.details).to eq(original_event)
    expect(round.events.order(:id).last.action).to eq("reassigned")
    expect(HiringInterviewPolicy.new(interviewer, round.reload).show?).to be(false)
    expect(@console_errors).to be_empty
    screenshot("round-reassigned-desktop")
  end

  it "opens submitted assessment handover and downloads the private file without executing candidate code" do
    bytes = "raise 'untrusted candidate code must never execute'"
    submitted_work(bytes)
    round = record_round
    sign_in interviewer
    visit "/interview-reviews/#{round.id}"
    within('section[aria-label="Assessment handover"]') do
      expect(page).to have_text("I can explain the query and tests")
      expect(page).to have_text("Review without execution")
      Dir.mktmpdir("miru-interview-work") do |directory|
        downloads = page.driver.browser.downloads
        downloads.set_behavior(save_path: directory)
        expect(downloads.wait(10) { click_button "Download untrusted.rb", exact: true }).to be(true)
        expect(File.binread(File.join(directory, "untrusted.rb"))).to eq(bytes)
      end
    end
    expect(@console_errors).to be_empty
    screenshot("assessment-handover-desktop")
  end
end
