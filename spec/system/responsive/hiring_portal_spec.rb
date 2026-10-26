# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Candidate application form", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Hiring QA") }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }

  around do |example|
    original = HiringPortalController.allow_forgery_protection
    HiringPortalController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    HiringPortalController.allow_forgery_protection = original
  end

  it "submits a private mobile form with compensation and a resume without exposing the token or internal notes" do
    admin.add_role(:admin, company)
    form = Hiring::Form.default_schema.merge("enabled" => true)
    form.fetch("fields").find { |field| field["id"] == "resume" }["required"] = true
    form.fetch("fields") << { "id" => "custom_future_contact", "label" => "Contact about future roles", "type" => "checkbox",
                             "required" => false, "sensitive" => false }
    details = HiringSetting::TEXT_FIELDS.index_with { |field| "Synthetic approved #{field}" }.merge("client_count" => 0)
    configuration = Hiring::Configure.new(company:, actor: admin)
    setting = configuration.save_draft!(details:, form:, lock_version: nil)
    configuration.approve!(lock_version: setting.lock_version)
    mailbox = HiringMailbox.create!(company:, name: "Hiring QA", source_email: "hiring@example.test")
    source = Mail.new do
      from "Synthetic Applicant <synthetic-candidate@example.test>"
      to "hiring@example.test"
      subject "Application for Rails developer"
      message_id "candidate-browser-qa@example.test"
      body "Please consider my application."
      attachments["resume.txt"] = "Synthetic initial resume"
    end.encoded
    receipt = Hiring::ReceiveEmail.new(mailbox:, source:).process
    Hiring::EmailIntake.new(receipt).process
    application = receipt.reload.hiring_application
    expect(application).to be_present
    application.update!(notes: "Internal assessment only")
    message = company.hiring_messages.find_by!(hiring_application_id: application.id)
    expect(message.content["portal_access_id"]).to be_present
    access = HiringPortalAccess.find(message.content.fetch("portal_access_id"))
    link = URI(message.content.fetch("body").scan(%r{https?://\S+}).last)
    requests = []
    page.driver.browser.on("Network.requestWillBeSent") { |event| requests << event.fetch("request").fetch("url") }
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    page.current_window.resize_to(375, 900)
    visit "#{link.path}##{link.fragment}"
    expect(page).to have_css("h1", text: "Application form")
    expect(page).to have_text("Synthetic approved company_intro")
    expect(page.current_url).not_to include(access.access_token)
    expect(page).not_to have_text("Internal assessment only")
    fill_in "Full name", with: "Submitted Synthetic Applicant"
    fill_in "Email", with: "submitted-candidate@example.test"
    fill_in "Time zone", with: "Asia/Kolkata"
    select_radix "Employment status", "Not currently employed"
    find('button[aria-label="Clear Employment status"]').click
    expect(find("button#candidate-employment_status")).to have_text("Choose an answer")
    select_radix "Employment status", "Not currently employed"
    select_radix "Contact about future roles", "No"
    find('button[aria-label="Clear Contact about future roles"]').click
    expect(find("button#candidate-custom_future_contact")).to have_text("Choose an answer")
    fill_in "Current compensation amount", with: "0"
    fill_in "Current compensation currency", with: "INR"
    select_radix "Current compensation period", "Monthly"
    find('button[aria-label="Clear Current compensation"]').click
    expect(page).to have_field("Current compensation amount", with: "")
    expect(page).to have_field("Current compensation currency", with: "")
    expect(find("button#candidate-current_compensation-period")).to have_text("Choose period")
    fill_in "Expected compensation amount", with: "120000.50"
    fill_in "Expected compensation currency", with: "INR"
    select_radix "Expected compensation period", "Monthly"
    attach_file "Resume", Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    expect(page).to have_text("qa-main.pdf")
    click_button "Submit application"
    expect(page).to have_text("Application submitted")
    expect(page).to have_css('[role="status"]:focus', text: "Application submitted")
    submission = access.reload.hiring_submission
    expect(submission.submitted_at).to be_present
    expect(submission.resume).to be_attached
    expect(submission.answers.fetch("expected_compensation")).to eq("amount" => "120000.50", "currency" => "INR", "period" => "monthly")
    expect(submission.answers.fetch("current_compensation")).to be_nil
    expect(submission.answers.fetch("custom_future_contact")).to be_nil
    expect(application.hiring_candidate.reload.email).to eq("synthetic-candidate@example.test")
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to eq(true)
    expect(@console_errors).to eq([])
    http_requests = requests.grep(%r{\Ahttps?://}).map { |url| URI(url) }
    expect(http_requests.map(&:path)).to include("/hiring-form/open", "/hiring-form/resume", "/hiring-form/submit")
    origin = URI(page.current_url)
    expect(http_requests.map { |url| [url.scheme, url.host, url.port] }.uniq).to eq([[origin.scheme, origin.host, origin.port]])
    expect(requests).not_to include(a_string_including(access.access_token), a_string_matching(%r{/(?:ahoy|analytics|replay)(?:/|$)}))
    if ENV["MIRU_QA_SCREENSHOTS"] == "1"
      page.save_screenshot(Rails.root.join("docs/qa/hiring-2463/candidate-submitted-mobile.png"), full: true)
    end
  end

  it "refreshes committed resume metadata after a lost response without discarding unsent answers" do
    admin.add_role(:admin, company)
    configuration = Hiring::Configure.new(company:, actor: admin)
    details = HiringSetting::TEXT_FIELDS.index_with { |field| "Synthetic approved #{field}" }.merge("client_count" => 0)
    setting = configuration.save_draft!(details:, form: Hiring::Form.default_schema.merge("enabled" => true), lock_version: nil)
    configuration.approve!(lock_version: setting.lock_version)
    application = Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id,
      "request_key" => SecureRandom.uuid, "full_name" => "Verified Candidate", "email" => "verified@example.test" }).process
    access = Hiring::Form.issue!(application:, setting:)
    page.current_window.resize_to(375, 900)
    visit "/hiring-form##{access.access_token}"
    expect(page).to have_field("Full name")
    fill_in "Full name", with: "Unsent candidate name"
    fill_in "Email", with: "unsent@example.test"
    fill_in "Work summary", with: "My unsent work history must survive a lost upload response."
    page.execute_script <<~JS
      const originalFetch = window.fetch;
      let rejectFirstUpload = true;
      let loseUploadResponse = true;
      let loseSubmitResponse = true;
      window.__miruCandidateUploadRestore = () => { window.fetch = originalFetch; };
      window.fetch = async (...args) => {
        if (rejectFirstUpload && String(args[0]) === '/hiring-form/resume') {
          rejectFirstUpload = false;
          return new Response(JSON.stringify({errors: 'Synthetic temporary upload failure'}), {
            status: 503, headers: {'Content-Type': 'application/json'}
          });
        }
        const response = await originalFetch(...args);
        if (loseUploadResponse && String(args[0]) === '/hiring-form/resume' && response.ok) {
          loseUploadResponse = false;
          throw new TypeError('Synthetic lost upload response');
        }
        if (loseSubmitResponse && String(args[0]) === '/hiring-form/submit' && response.ok) {
          loseSubmitResponse = false;
          throw new TypeError('Synthetic lost submission response');
        }
        return response;
      };
    JS
    attach_file "Resume", Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    expect(page).to have_css('[role="alert"]', text: "Synthetic temporary upload failure")
    expect(access.reload.hiring_submission.resume).not_to be_attached
    expect(find_field("Resume").value).to eq("")
    attach_file "Resume", Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    expect(page).to have_css('[role="alert"]', text: "Synthetic lost upload response")
    expect(page).to have_css('[role="alert"]:focus')
    expect(access.reload.hiring_submission.resume).to be_attached
    expect(access.hiring_submission.submitted_at).to be_nil
    click_button "Refresh form", exact: true
    expect(page).to have_text("Uploaded: qa-main.pdf")
    expect(page).to have_field("Full name", with: "Unsent candidate name")
    expect(page).to have_field("Work summary", with: "My unsent work history must survive a lost upload response.")
    if ENV["MIRU_QA_SCREENSHOTS"] == "1"
      page.save_screenshot(Rails.root.join("docs/qa/hiring-2463/candidate-resume-retry-mobile.png"), full: true)
    end
    click_button "Submit application"
    expect(page).to have_css('[role="alert"]', text: "Synthetic lost submission response")
    expect(access.reload.hiring_submission.submitted_at).to be_present
    fill_in "Full name", with: "An edit after the accepted submission"
    click_button "Refresh form", exact: true
    expect(page).to have_text("Application submitted")
    expect(page).to have_field("Full name", with: "Unsent candidate name", disabled: true)
    expect(access.reload.hiring_submission.answers.fetch("full_name")).to eq("Unsent candidate name")
    expect(application.hiring_candidate.reload.email).to eq("verified@example.test")
  ensure
    page.execute_script("window.__miruCandidateUploadRestore?.()")
  end
end
