# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Candidate assessment portal", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Assessment QA") }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:assignment) do
    admin.add_role(:admin, company)
    application = Hiring::Intake.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => "Synthetic Assessment Candidate", "email" => "assessment@example.test", "notes" => "Private staff assessment"
    }).process
    template = Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "title" => "Searchable catalogue", "details" => {
        "instructions" => "Build a searchable catalogue", "criteria" => "Explain query design and tests",
        "expected_minutes" => 90, "submission_method" => "repository_or_files", "ai_policy" => "Describe any tools and your own contribution"
      }
    }).process
    template = Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "lock_version" => template.lock_version
    }).process(template:, action: "approve")
    Hiring::Assignments.new(application:, actor: admin).issue!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "template_id" => template.id,
      "template_version" => template.lock_version, "reviewer_employment_id" => membership.id,
      "due_at" => 2.days.from_now.iso8601, "request_key" => SecureRandom.uuid, "candidate_note" => "Explain the indexing choices"
    })
  end

  around do |example|
    original = HiringAssignmentPortalController.allow_forgery_protection
    HiringAssignmentPortalController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    HiringAssignmentPortalController.allow_forgery_protection = original
  end

  it "submits disclosed work on mobile and retains private files without executing or exposing them" do
    record = assignment
    requests = []
    page.driver.browser.on("Network.requestWillBeSent") { |event| requests << event.fetch("request").fetch("url") }
    errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| errors << event }
    page.current_window.resize_to(375, 900)
    visit "/hiring-assignment##{record.access_token}"
    expect(page).to have_css("h1", text: "Searchable catalogue")
    expect(page).to have_text("Explain the indexing choices")
    expect(page.current_url).not_to include(record.access_token)
    expect(page).not_to have_text("Private staff assessment")
    fill_in "Setup instructions", with: "Run bin/setup and bundle exec rspec"
    fill_in "Approach and explanation", with: "I used indexed queries with request coverage"
    fill_in "Your own contribution", with: "I wrote and can explain the implementation and tests"
    select_radix "Did you use AI tools? (required)", "Yes"
    fill_in "AI tools used", with: "Local assistant"
    fill_in "How you used AI", with: "Discussed query alternatives"
    fill_in "Parts assisted by AI", with: "Test case suggestions"
    attach_file "Submission file", Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    expect(page).to have_button("Download qa-main.pdf")
    expect(page).to have_field("Your own contribution", with: "I wrote and can explain the implementation and tests")
    click_button "Submit assignment"
    expect(page).to have_css('[role="status"]:focus', text: "Assignment submitted")
    expect(page).to have_field("Setup instructions", disabled: true)
    expect(page).not_to have_button("Submit assignment")
    saved = record.reload.submission
    expect(saved.answers).to include("ai_used" => true, "ai_tools" => "Local assistant")
    expect(saved.submitted_at).to be_present
    expect(saved.file_bytes(saved.files.sole)).to eq(File.binread(Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")))
    expect(page.evaluate_script("document.documentElement.scrollWidth > window.innerWidth")).to be(false)
    expect(errors).to be_empty
    expect(requests).not_to include(a_string_including(record.access_token), a_string_matching(%r{/(?:ahoy|analytics|replay)(?:/|$)}))
  end

  it "recovers saved files and a final submission after lost responses without discarding unsent answers" do
    record = assignment
    page.current_window.resize_to(375, 900)
    visit "/hiring-assignment##{record.access_token}"
    expect(page).to have_css("h1", text: "Searchable catalogue")
    fill_in "Setup instructions", with: "Run bin/setup"
    fill_in "Approach and explanation", with: "Unsent explanation must survive upload recovery"
    fill_in "Your own contribution", with: "I wrote the implementation and tests"
    select_radix "Did you use AI tools? (required)", "No"
    page.execute_script <<~JS
      const originalFetch = window.fetch;
      let rejectUpload = true;
      let loseUpload = true;
      let loseSubmit = true;
      window.__miruAssessmentRestore = () => { window.fetch = originalFetch; };
      window.fetch = async (...args) => {
        if (rejectUpload && String(args[0]) === '/hiring-assignment/files') {
          rejectUpload = false;
          return new Response(JSON.stringify({errors: 'Synthetic temporary upload failure'}), {
            status: 503, headers: {'Content-Type': 'application/json'}
          });
        }
        const response = await originalFetch(...args);
        if (loseUpload && String(args[0]) === '/hiring-assignment/files' && response.ok) {
          loseUpload = false;
          throw new Error('Synthetic lost upload response');
        }
        if (loseSubmit && String(args[0]) === '/hiring-assignment/submit' && response.ok) {
          loseSubmit = false;
          throw new Error('Synthetic lost submit response');
        }
        return response;
      };
    JS
    source = Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    attach_file "Submission file", source
    expect(page).to have_text("Synthetic temporary upload failure")
    attach_file "Submission file", source
    expect(page).to have_text("Synthetic lost upload response")
    expect(record.reload.submission.files.count).to eq(1)
    click_button "Refresh assignment"
    expect(page).to have_button("Download qa-main.pdf")
    expect(page).to have_field("Approach and explanation", with: "Unsent explanation must survive upload recovery")
    click_button "Remove qa-main.pdf"
    expect(page).not_to have_button("Download qa-main.pdf")
    expect(record.reload.submission.files.count).to eq(0)
    attach_file "Submission file", source
    expect(page).to have_button("Download qa-main.pdf")
    click_button "Submit assignment"
    expect(page).to have_text("Synthetic lost submit response")
    expect(record.reload.submission.submitted_at).to be_present
    click_button "Refresh assignment"
    expect(page).to have_css('[role="status"]:focus', text: "Assignment submitted")
    expect(page).to have_field("Approach and explanation", with: "Unsent explanation must survive upload recovery", disabled: true)
    expect(page).not_to have_button("Remove qa-main.pdf")
    expect(page).not_to have_button("Submit assignment")
  ensure
    page.execute_script("window.__miruAssessmentRestore?.()")
  end
end
