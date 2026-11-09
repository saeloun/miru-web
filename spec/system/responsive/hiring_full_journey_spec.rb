# frozen_string_literal: true

require "rails_helper"
require "net/http"

RSpec.describe "Continuous synthetic hiring journey", type: :system, js: true do
  include_context "assignment message records"
  include_context "hiring SMTP transport"
  let(:company) { create(:company, name: "Synthetic Full Hiring Journey") }
  let(:candidate_name) { "Taylor Candidate" }
  let(:application) { company.hiring_applications.sole }
  let(:pdf) { Rails.root.join("spec/fixtures/files/qa-main.pdf") }

  around do |example|
    controllers = [Api::V1::Hiring::BaseController, HiringPortalController, HiringAssignmentPortalController,
      Api::V1::SignatureRequestsController]
    protection = controllers.index_with(&:allow_forgery_protection)
    controllers.each { |controller| controller.allow_forgery_protection = true }
    previous_password = ENV["RAILS_INBOUND_EMAIL_PASSWORD"]
    ENV["RAILS_INBOUND_EMAIL_PASSWORD"] = "synthetic-full-journey-relay"
    with_forgery_protection { example.run }
  ensure
    protection&.each { |controller, value| controller.allow_forgery_protection = value }
    ENV["RAILS_INBOUND_EMAIL_PASSWORD"] = previous_password
  end

  before do
    @console_errors, @queue_proof, @downloads, @smtp_subjects = [], [], [], []
    watch_console
    assignment_template
    panel
    settings = HiringSetting::TEXT_FIELDS.index_with { |field| "Approved synthetic #{field}" }.merge("client_count" => 0,
      "assignment_subject" => "Your practical assignment", "assignment_body" => "Review the task and disclose assistance.",
      "offer_subject" => "Your private offer", "offer_body" => "Review your private terms and respond.")
    configuration = Hiring::Configure.new(company:, actor: admin)
    saved = configuration.save_draft!(details: settings, form: Hiring::Form.default_schema.merge("enabled" => true), lock_version: nil)
    configuration.approve!(lock_version: saved.lock_version)
    allow(Rails.application.config.action_mailer).to receive(:default_url_options)
      .and_return(host: Capybara.server_host, port: Capybara.server_port, protocol: "http")
    adapter = ActiveJob::QueueAdapters::SolidQueueAdapter.new
    [ActionMailbox::RoutingJob, HiringIntakeJob, HiringDeliveryJob, ActionMailer::MailDeliveryJob].each do |job|
      allow(job).to receive(:queue_adapter).and_return(adapter)
    end
  end

  after { expect(@console_errors).to eq([]) }

  def watch_console
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
  end

  def capture(name, full: true)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_FULL_JOURNEY_SHOTS"]

    folder = Rails.root.join(ENV.fetch("HIRING_FULL_JOURNEY_SHOTS"))
    FileUtils.mkdir_p(folder)
    page.save_screenshot(folder.join("#{name}.png"), full:)
  end

  def drain_durable_jobs
    expect(SolidQueue::ReadyExecution.count).to be_positive
    Timeout.timeout(10) do
      while SolidQueue::ReadyExecution.exists?
        worker = SolidQueue::Worker.new(queues: ["*"], threads: 1, polling_interval: 0.01)
        worker.mode = :inline
        worker.start
      end
    end
    expect(SolidQueue::FailedExecution.count).to eq(0)
    expect(SolidQueue::ClaimedExecution.count).to eq(0)
    @queue_proof = SolidQueue::Job.order(:id).map { |job| job.slice(:id, :class_name, :active_job_id, :finished_at) }
    expect(@queue_proof).to all(include("finished_at" => be_present))
  end

  def delivered_mail(invitation: false)
    captured = nil
    with_smtp_response do |commands, messages, port|
      previous = [UserInvitationMailer.delivery_method, UserInvitationMailer.smtp_settings, UserInvitationMailer.perform_deliveries]
      begin
        if invitation
          UserInvitationMailer.delivery_method = :smtp
          UserInvitationMailer.perform_deliveries = true
          UserInvitationMailer.smtp_settings = { address: "127.0.0.1", port:, domain: "localhost", enable_starttls: false,
            enable_starttls_auto: false, open_timeout: 2, read_timeout: 2 }
          allow(UserInvitationMailer).to receive(:default_url_options)
            .and_return(host: Capybara.server_host, port: Capybara.server_port, protocol: "http")
        end
        drain_durable_jobs
      ensure
        UserInvitationMailer.delivery_method, UserInvitationMailer.smtp_settings, UserInvitationMailer.perform_deliveries = previous
      end
      expect(commands.count("DATA")).to eq(1)
      captured = Mail.read_from_string(messages.sole)
      expect(captured.to).to eq(["candidate@example.test"])
      @smtp_subjects << captured.subject
    end
    captured
  end

  def private_link(mail, path)
    body = mail.text_part&.body&.decoded || mail.body.decoded
    body[%r{http://[^\s]+/#{path}\#[A-Za-z0-9]+}].tap { |link| expect(link).to be_present }
  end

  def download_hash(path, expected, label)
    result = page.evaluate_async_script(<<~JS, "#{path}?company_id=#{company.id}")
      const done = arguments[1];
      fetch(arguments[0], {credentials: 'same-origin'}).then(async response => {
        const bytes = await response.arrayBuffer();
        const hash = await crypto.subtle.digest('SHA-256', bytes);
        done({status: response.status, bytes: bytes.byteLength, cache: response.headers.get('cache-control'),
          hash: Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('')});
      }).catch(error => done({error: error.message}));
    JS
    expect(result).to include("status" => 200, "hash" => expected)
    expect(result.fetch("bytes")).to be_positive
    @downloads << result.merge("boundary" => label)
  end

  def admin_application
    # The shared sign-in helper resets every Capybara session when changing actors.
    sign_in admin
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_css("h2", text: candidate_name)
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
  end

  def open_control(control)
    page.scroll_to(control, align: :center)
    control.click
    yield
  end

  def queue_candidate_message
    expect(page).to have_no_text("Loading messages…")
    inbox = find("button[role='combobox']", text: "Choose enabled inbox", exact_text: true)
    open_control(inbox) { expect(inbox).to match_selector("[aria-expanded='true']") }
    find("[cmdk-item]", text: "Hiring · #{mailbox.source_email}", exact_text: true).click
    click_button "Preview candidate message"
    expect(page).to have_button("Confirm and queue message", disabled: false)
    click_button "Confirm and queue message"
    expect(page).to have_text("Attempt 1")
  end

  def relay_and_submit_form
    source = Mail.new do
      from "Taylor Candidate <candidate@example.test>"
      to "hiring@example.test"
      subject "Application for Rails developer"
      message_id "continuous-journey@example.test"
      text_part { body "Please consider my application for Rails developer. My resume is attached." }
      attachments["resume.pdf"] = File.binread(Rails.root.join("spec/fixtures/files/qa-main.pdf"))
    end.encoded
    2.times do
      request = Net::HTTP::Post.new("/hiring/inbound/#{mailbox.routing_key}")
      request.basic_auth("actionmailbox", "synthetic-full-journey-relay")
      request["Content-Type"] = "message/rfc822"
      request.body = source
      response = Net::HTTP.start("127.0.0.1", Capybara.server_port) { |http| http.request(request) }
      expect(response.code).to eq("204")
    end
    expect(company.hiring_receipts.count).to eq(1)
    expect(company.hiring_applications.count).to eq(0)
    expect(SolidQueue::Job.where(class_name: "ActionMailbox::RoutingJob").count).to be_positive
    acknowledgement = delivered_mail
    expect(company.hiring_receipts.sole.state).to eq("accepted")
    expect(company.hiring_applications.count).to eq(1)
    expect(company.hiring_messages.sole.state).to eq("sent")
    admin_application
    receipt = company.hiring_receipts.sole
    download_hash("/api/v1/hiring/receipts/#{receipt.id}/source", Digest::SHA256.hexdigest(source), "retained-relay-source")
    capture("01-authenticated-relay-and-acknowledgement")
    using_session(:candidate) do
      watch_console
      page.current_window.resize_to(390, 900)
      visit private_link(acknowledgement, "hiring-form")
      expect(page).to have_css("h1", text: "Application form")
      fill_in "Full name", with: candidate_name
      fill_in "Email", with: "candidate@example.test"
      fill_in "Time zone", with: "Asia/Kolkata"
      fill_in "Total experience", with: "5"
      attach_file "Resume", pdf
      expect(page).to have_text("qa-main.pdf")
      click_button "Submit application"
      expect(page).to have_text("Application submitted")
      expect(page.current_url).not_to include(application.hiring_portal_accesses.sole.access_token)
      capture("02-candidate-form-and-private-resume")
    end
    admin_application
    access = application.hiring_portal_accesses.sole
    download_hash("/api/v1/hiring/applications/#{application.id}/forms/#{access.id}/resume", Digest::SHA256.file(pdf).hexdigest, "admin-resume")
  end

  def issue_and_review_assignment
    find("#assessment-template").click
    find("[cmdk-item]", text: assignment_template.title).click
    find("#assessment-reviewer").click
    find("[cmdk-item]", text: interviewer.full_name).click
    fill_in "Submission deadline", with: 2.days.from_now.strftime("%Y-%m-%dT%H:%M")
    click_button "Issue assignment link"
    expect(page).to have_text("Assignment link created. No email was sent.")
    record = application.hiring_assignments.sole
    open_control(find_button("Candidate messages for assignment #{record.id}")) do
      expect(page).to have_button("Hide assignment #{record.id}")
    end
    queue_candidate_message
    mail = delivered_mail
    expect(company.hiring_messages.find_by!(kind: "assignment").state).to eq("sent")
    using_session(:candidate) do
      visit private_link(mail, "hiring-assignment")
      expect(page).to have_css("h1", text: assignment_template.title)
      fill_in "Repository URL", with: "https://example.test/untrusted-work-not-executed"
      fill_in "Setup instructions", with: "Review files without executing them"
      fill_in "Approach and explanation", with: "Indexed queries and focused request tests"
      fill_in "Your own contribution", with: "I wrote and can explain the implementation and tests"
      select_radix "Did you use AI tools? (required)", "No"
      attach_file "Submission file", pdf
      expect(page).to have_button("Download qa-main.pdf")
      click_button "Submit assignment"
      expect(page).to have_text("Assignment submitted")
      capture("03-emailed-assignment-and-submission")
    end
    using_session(:reviewer) do
      watch_console
      sign_in interviewer
      visit "/assignment-reviews/#{record.id}"
      expect(page).to have_css("h1", text: "Assignment review", exact_text: true)
      download_hash("/api/v1/hiring/assignment_reviews/#{record.id}/files/#{record.submission.files.sole.id}",
        Digest::SHA256.file(pdf).hexdigest, "designated-reviewer-assignment")
      ["Correctness", "Code quality", "Testing", "Maintainability", "Problem solving", "Understanding"].each do |label|
        fill_in label, with: "Evidence from the submitted files and explanation"
      end
      select "Pass", from: "Recommendation"
      click_button "Record assessment review"
      expect(page).to have_text("Review recorded. Admin decides the next step.")
      capture("04-designated-reviewer-private-download-and-review")
    end
    admin_application
    select "Advance to interview", from: "Assignment action"
    fill_in "Decision reason", with: "Assessment review supports an interview"
    click_button "Save assignment decision"
    expect(page).to have_text("Assignment decision saved.")
    expect(application.reload.stage).to eq("interview")
  end

  def interview_and_decide
    open_control(find_button("View interview rounds")) do
      expect(page).to have_button("Add interview round", disabled: false)
    end
    click_button "Add interview round"
    fill_in "Round title", with: "Rails discussion"
    fill_in "Round type", with: "Technical"
    fill_in "Duration (minutes)", with: "45"
    fill_in "Assessment criteria", with: "Explain the submitted query and tests"
    fill_in "Candidate preparation", with: "Bring the submitted project"
    fill_in "Feedback questions (one per line)", with: "Explain a tradeoff"
    find("#round-panel").click
    find("[cmdk-item]", text: interviewer.full_name).click
    click_button "Save interview round"
    expect(page).to have_text("Interview round saved")
    open_control(find_button("Manage booking for round 1")) do
      expect(page).to have_button("Record manual booking", disabled: false)
    end
    open_control(find_button("Record manual booking")) do
      expect(page).to have_field("Start in candidate's local time")
    end
    fill_in "Start in candidate's local time", with: "2026-11-03T14:30"
    fill_in "Candidate time zone", with: "Asia/Kolkata"
    fill_in "Meeting URL", with: "https://meet.example.test/synthetic"
    fill_in "Booking instructions", with: "Contact the hiring team to reschedule"
    fill_in "Feedback due within (hours after interview)", with: "24"
    click_button "Save booking"
    expect(page).to have_text("Booking recorded")
    booking = application.hiring_interviews.sole.hiring_interview_bookings.sole
    using_session(:reviewer) do
      sign_in interviewer
      visit "/interview-feedback/#{booking.hiring_feedbacks.sole.id}"
      expect(page).to have_text("Record interview feedback")
      fill_in "Actual interview date", with: "2026-11-03"
      select "Attended", from: "Attendance"
      expect(page).to have_field("Explain a tradeoff")
      ["Topics covered", "Assessment", "Technical skills", "Communication", "Strengths", "Concerns",
        "Evidence and examples", "Explain a tradeoff"].each { |label| fill_in label, with: "Evidence discussed in the synthetic interview" }
      select "Pass", from: "Recommendation"
      click_button "Submit feedback"
      expect(page).to have_text("Feedback submitted")
      capture("05-interview-feedback")
    end
    admin_application
    open_control(find_button("Review decisions")) do
      expect(page).to have_field("Internal decision reason")
    end
    fill_in "Internal decision reason", with: "Select based on assessment and interview evidence"
    click_button "Save decision draft"
    expect(page).to have_text("Decision draft saved")
    check "I confirm this final decision"
    click_button "Finalize saved decision"
    expect(page).to have_text("Decision finalized.")
    expect(application.reload.stage).to eq("final_decision")
  end

  def offer_and_onboard
    open_control(find_button("Review offers")) { expect(page).to have_select("Offer engagement") }
    select "Consultant", from: "Offer engagement"
    fill_in "Offer title", with: "Software consultant"
    fill_in "Approved compensation amount", with: "125000.50"
    fill_in "Offer currency", with: "INR"
    select "Monthly", from: "Compensation period"
    fill_in "Proposed joining date", with: "2026-11-20"
    fill_in "Offer expiry date", with: "2026-11-10"
    click_button "Save offer draft"
    expect(page).to have_text("Offer draft saved")
    check "I approve these saved terms and the private offer link"
    click_button "Approve and issue private offer"
    expect(page).to have_text("Private offer issued.")
    offer = application.hiring_offers.sole
    open_control(find_button("Candidate messages for offer #{offer.id}")) do
      expect(page).to have_button("Hide offer #{offer.id}")
    end
    queue_candidate_message
    mail = delivered_mail
    using_session(:candidate) do
      visit private_link(mail, "hiring-offer")
      expect(page).to have_text("125000.50 INR / monthly")
      check "I have reviewed these offer terms"
      click_button "Accept offer"
      expect(page).to have_text("Your acceptance is recorded")
      capture("06-emailed-offer-acceptance")
    end
    expect(offer.reload.state).to eq("accepted")
    admin_application
    open_control(find_button("Review offers")) do
      expect(page).to have_button("Review onboarding for offer #{offer.id}")
    end
    open_control(find_button("Review onboarding for offer #{offer.id}")) do
      expect(page).to have_field("Onboarding first name")
    end
    fill_in "Onboarding first name", with: "Taylor"
    fill_in "Onboarding last name", with: "Candidate"
    check "I confirm this accepted offer and the reviewed profile or invitation"
    click_button "Confirm onboarding"
    expect(page).to have_text("The recipient must accept before a profile is created.")
    invitation_mail = delivered_mail(invitation: true)
    body = invitation_mail.html_part&.body&.decoded || invitation_mail.body.decoded
    invitation_link = Nokogiri::HTML(body).css("a[href]").map { |link| link["href"] }.find { |url| url.include?("/invitations/accepts?") }
    expect(invitation_link).to start_with("http://localhost:#{Capybara.server_port}/invitations/accepts?")
    using_session(:candidate) do
      visit invitation_link
      click_button "Accept invitation"
      expect(page).to have_text("Reset Password")
      fill_in "password", with: "Password1!"
      fill_in "confirm_password", with: "Password1!"
      click_button "Reset Password"
      expect(page).to have_current_path("/").or have_current_path("/dashboard").or have_current_path("/time-tracking")
      expect(page).to have_link("Time Tracking", href: "/time-tracking")
      expect(page).to have_text(candidate_name)
      capture("07-consultant-account-created")
    end
    employment = offer.reload.employment
    expect(employment).to have_attributes(employment_type: "contractor")
    expect(employment.compensation_versions).to be_empty
    expect(application.reload.stage).to eq("hired")
    admin_application
    open_control(find_button("Review offers")) do
      expect(page).to have_button("Review onboarding for offer #{offer.id}")
    end
    open_control(find_button("Review onboarding for offer #{offer.id}")) do
      expect(page).to have_text("Onboarding complete")
    end
    click_link "Upload agreement documents"
    expect(page).to have_select("Linked profile", selected: "Taylor Candidate — candidate@example.test")
    fill_in "Document title", with: "Synthetic continuous consultant agreement"
    originals = %w[qa-main.pdf qa-addendum.pdf].map { |name| Rails.root.join("docs/qa/generic-document-signing-2462", name) }
    attach_file "PDF documents", originals
    click_button "Create signing draft"
    expect(page).to have_css('[data-pdf-ready="true"]')
    click_button "Add recipient"
    within("fieldset[aria-label='Recipient 1']") do
      fill_in "Name", with: candidate_name
      fill_in "Email", with: "candidate@example.test"
    end
    click_button "Add field"
    fill_in "Field label", with: "Consultant signature"
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    signature = SignatureRequest.find_by!(company:, title: "Synthetic continuous consultant agreement")
    expect(signature.employment_id).to eq(employment.id)
    revision = signature.current_revision
    expect(revision.documents.size).to eq(2)
    revision.documents.each_with_index do |document, index|
      download_hash("/api/v1/signature_requests/#{signature.id}/revisions/#{revision.id}/originals/#{document.fetch('key')}",
        Digest::SHA256.file(originals[index]).hexdigest, "original-legal-pdf-#{index + 1}")
    end
    expect(revision.fields.sole.fetch("label")).to eq("Consultant signature")
    expect(revision.status).to eq("draft")
    expect(revision.provider_envelope_id).to be_nil
    capture("08-linked-generic-two-pdf-fields", full: false)
  end

  it "takes one relay applicant through durable mail, private assessment, interview, accepted offer and consultant legal draft" do
    page.current_window.resize_to(1440, 1000)
    relay_and_submit_form
    issue_and_review_assignment
    interview_and_decide
    offer_and_onboard
    expect(company.hiring_candidates.count).to eq(1)
    expect(company.hiring_applications.count).to eq(1)
    expect(company.hiring_messages.where(state: "sent").count).to eq(3)
    expect(@smtp_subjects.size).to eq(4)
    expect(@queue_proof.map { |job| job.fetch("class_name") }).to include("ActionMailbox::RoutingJob", "HiringDeliveryJob", "ActionMailer::MailDeliveryJob")
    if ENV["HIRING_FULL_JOURNEY_SHOTS"]
      proof = { application_id: application.id, candidate_id: application.hiring_candidate_id,
        queues: @queue_proof, smtp_subjects: @smtp_subjects, private_downloads: @downloads }
      File.write(Rails.root.join(ENV.fetch("HIRING_FULL_JOURNEY_SHOTS"), "journey-proof.json"), JSON.pretty_generate(proof))
    end
  end
end
