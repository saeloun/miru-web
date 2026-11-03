# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin and designated-staff assessments", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Assessment Review") }
  let(:admin) { create(:user, first_name: "Synthetic", last_name: "Admin", current_workspace: company) }
  let!(:admin_membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:reviewer) { create(:user, first_name: "Designated", last_name: "Reviewer", current_workspace: company) }
  let!(:reviewer_membership) { create(:employment, company:, user: reviewer, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => "Synthetic Review Candidate", "email" => "review-candidate@example.test", "notes" => "Private Admin-only hiring notes" }).process
  end
  let(:template) do
    task = Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "title" => "Catalogue review task", "details" => {
        "instructions" => "Build a searchable catalogue", "criteria" => "Explain query design and tests", "expected_minutes" => 90,
        "submission_method" => "repository_or_files", "ai_policy" => "Disclose tools and your contribution"
      }
    }).process
    Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "lock_version" => task.lock_version
    }).process(template: task, action: "approve")
  end

  before do
    admin.add_role(:admin, company)
    reviewer.add_role(:employee, company)
    template
  end

  around do |example|
    previous = Api::V1::Hiring::BaseController.allow_forgery_protection
    portal = HiringAssignmentPortalController.allow_forgery_protection
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    HiringAssignmentPortalController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = previous
    HiringAssignmentPortalController.allow_forgery_protection = portal
  end

  def admin_page
    sign_in admin
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_css('section[aria-label="Assignments"]')
  end

  def choose_task_and_reviewer
    find("#assessment-template").click
    expect(page).to have_field("Search approved tasks")
    find("[cmdk-item]", text: template.title).click
    expect(page).to have_text("Approved task version #{template.lock_version}")
    find("#assessment-reviewer").click
    find("[cmdk-item]", text: reviewer.full_name).click
    fill_in "Submission deadline", with: 2.days.from_now.strftime("%Y-%m-%dT%H:%M")
  end

  def submit_candidate(link, explanation)
    sign_out admin
    sign_out reviewer
    visit link
    expect(page).to have_css("h1", text: template.title)
    fill_in "Repository URL", with: "https://example.test/synthetic-work"
    fill_in "Setup instructions", with: "Run bin/setup and bundle exec rspec"
    fill_in "Approach and explanation", with: explanation
    fill_in "Your own contribution", with: "I wrote and can explain this implementation and its tests"
    select_radix "Did you use AI tools? (required)", "No"
    click_button "Submit assignment"
    expect(page).to have_text("Assignment submitted")
  end

  def fill_review(text = "Evidence from the implementation and submitted explanation")
    %w[Correctness Testing Maintainability Understanding].concat(["Code quality", "Problem solving"]).each do |label|
      fill_in label, with: text
    end
  end

  def record_review(assignment, outcome: "Pass", actor: reviewer)
    sign_in actor
    visit "/assignment-reviews/#{assignment.id}"
    expect(page).to have_css("h1", text: "Assignment review")
    expect(page).not_to have_text("Private Admin-only hiring notes")
    fill_review
    select outcome, from: "Recommendation"
    if outcome == "Clarification Required"
      select "Walkthrough", from: "Follow-up request"
      fill_in "Review notes", with: "Please walk through the query and explain your own contribution"
    end
    click_button "Record assessment review"
    expect(page).to have_text("Review recorded. Admin decides the next step.")
    sign_out actor
  end

  def submitted_assignment
    service = Hiring::Assignments.new(application:, actor: admin)
    record = service.issue!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "template_id" => template.id, "template_version" => template.lock_version, "reviewer_employment_id" => reviewer_membership.id,
      "due_at" => 2.days.from_now.iso8601, "request_key" => SecureRandom.uuid })
    yield record if block_given?
    Hiring::Assignments.new(application:, actor: nil).submit!(assignment: record, token: record.access_token, attributes: {
      "assignment_version" => record.lock_version, "submission_version" => record.submission.lock_version,
      "answers" => { "repository_url" => "https://example.test/work", "setup" => "Run bin/setup", "approach" => "Used query tests",
        "own_contribution" => "Synthetic private contribution statement", "ai_used" => false }
    })
    record.reload
  end

  def direct_review(record, text)
    Hiring::Assignments.new(application:, actor: reviewer).review!(assignment: record, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "assignment_version" => record.reload.lock_version, "submission_id" => record.submission.id,
      "outcome" => "pass", "request_kind" => "none", "dimensions" => HiringAssignmentReview::DIMENSIONS.index_with { text }
    })
  end

  %i[admin reviewer].each do |role|
    it "releases row locks while reading a private assessment download for #{role}" do
      source = Rails.root.join("spec/fixtures/files/qa-main.pdf")
      record = submitted_assignment do |assignment|
        File.open(source, "rb") do |file|
          upload = ActionDispatch::Http::UploadedFile.new(tempfile: file, filename: "qa-main.pdf", type: "application/pdf")
          Hiring::Assignments.new(application:, actor: nil).upload!(assignment:, token: assignment.access_token, attributes: {
            "assignment_version" => assignment.lock_version, "submission_version" => assignment.submission.lock_version, "file" => upload
          })
        end
      end
      actor = public_send(role)
      sign_in actor
      page.current_window.resize_to(role == :admin ? 1440 : 390, 900)
      errors = []
      page.driver.browser.on("Runtime.consoleAPICalled") { |event| errors << event if event["type"] == "error" }
      page.driver.browser.on("Runtime.exceptionThrown") { |event| errors << event }
      controller = role == :admin ? Api::V1::Hiring::AssignmentsController : Api::V1::Hiring::AssignmentReviewsController
      checked_reads = []
      allow_any_instance_of(controller).to receive(:render).and_wrap_original do |original, *arguments, **options, &block|
        check_hiring_rows_available(company)
        checked_reads << original.receiver.action_name
        original.call(*arguments, **options, &block)
      end
      if role == :reviewer
        visit "/assignment-reviews"
        expect(page).to have_link("Synthetic Review Candidate · Catalogue review task")
      end
      visit(role == :admin ? "/hiring/applications/#{application.id}" : "/assignment-reviews/#{record.id}")
      expect(page).to have_button("Download qa-main.pdf")
      checked_download = false
      allow_any_instance_of(ActiveStorage::Blob).to receive(:download).and_wrap_original do |original, *arguments, &block|
        check_hiring_rows_available(company, actor, application, record)
        checked_download = true
        original.call(*arguments, &block)
      end
      Dir.mktmpdir("miru-assessment-download") do |directory|
        downloads = page.driver.browser.downloads
        downloads.set_behavior(save_path: directory)
        expect(downloads.wait(10) { click_button "Download qa-main.pdf", exact: true }).to be(true)
        expect(File.binread(File.join(directory, "qa-main.pdf"))).to eq(File.binread(source))
      end
      expect(checked_download).to be(true)
      expect(checked_reads).to include("index")
      expect(checked_reads).to include("show") if role == :reviewer
      path = role == :admin ? "/api/v1/hiring/applications/#{application.id}/assignments" : "/api/v1/hiring/assignment_reviews/#{record.id}"
      expect(hiring_head(path, company.id)).to eq("status" => 200, "body" => "")
      expect(hiring_head(path, company.id + 1)).to eq("status" => 409, "body" => "")
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
      if ENV["HIRING_DOWNLOAD_SHOTS"]
        directory = Rails.root.join(ENV.fetch("HIRING_DOWNLOAD_SHOTS"))
        FileUtils.mkdir_p(directory)
        page.save_screenshot(directory.join("#{role}-download.png"), full: true)
      end
      membership = role == :admin ? admin_membership : reviewer_membership
      allow_any_instance_of(ActiveStorage::Blob).to receive(:download).and_wrap_original do |original, *arguments, &block|
        bytes = original.call(*arguments, &block)
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do |connection|
            connection.transaction do
              connection.execute("SET LOCAL lock_timeout = '1s'")
              Employment.where(id: membership.id).update_all(resigned_at: Date.yesterday)
            end
          end
        end.value
        bytes
      end
      file_path = role == :admin ? "#{path}/#{record.id}/files/#{record.submission.files.sole.id}" : "#{path}/files/#{record.submission.files.sole.id}"
      denied = page.evaluate_async_script(<<~JS, file_path, company.id)
        const done = arguments[2];
        fetch(arguments[0] + '?company_id=' + arguments[1])
          .then(async response => done({status: response.status, body: await response.text()}))
          .catch(error => done({error: error.message}));
      JS
      expect(membership.reload.resigned_at).to eq(Date.yesterday)
      expect(denied.fetch("status")).to eq(403)
      expect(denied.fetch("body")).not_to include("%PDF")
      expect(errors).to be_empty
    end
  end

  it "issues work, requests a walkthrough, preserves revised work and advances only after explicit Admin review" do
    release_history = true
    checked_issue = false
    allow_any_instance_of(Api::V1::Hiring::AssignmentsController).to receive(:render).and_wrap_original do |original, *arguments, **options, &block|
      if original.receiver.action_name == "create"
        check_hiring_rows_available(company, lock: "FOR KEY SHARE")
        checked_issue = true
      end
      original.call(*arguments, **options, &block)
    end
    page.current_window.resize_to(375, 900)
    admin_page
    choose_task_and_reviewer
    fill_in "Candidate instructions", with: "Explain your indexing choices"
    click_button "Issue assignment link"
    expect(page).to have_text("Assignment link created. No email was sent.")
    expect(checked_issue).to be(true)
    original = application.reload.hiring_assignments.sole
    link = find_link("Open candidate assignment")[:href]
    submit_candidate(link, "Original catalogue design")
    record_review(original, outcome: "Clarification Required")
    expect(application.reload.stage).to eq("assignment_review")
    admin_page
    within('section[aria-label="Assignments"]') do
      expect(page).to have_text("Please walk through the query")
      select "Request revised work", from: "Assignment action"
    end
    choose_task_and_reviewer
    fill_in "Candidate instructions", with: "Add a request test and explain the query changes"
    fill_in "Decision reason", with: "Clarify the submitted implementation with a small revision"
    release_history = false
    allow_any_instance_of(Api::V1::Hiring::AssignmentsController).to receive(:index).and_wrap_original do |original|
      original.call
      Async::Task.current.sleep(0.01) until release_history
    end
    click_button "Save assignment decision"
    expect(page).to have_text("Assignment decision saved.")
    within('section[aria-label="Assignments"]') do
      expect(page).to have_text("Loading assignments…")
      expect(page).not_to have_link("Open candidate assignment")
    end
    release_history = true
    replacement = application.reload.hiring_assignments.order(:id).last
    expect(replacement.previous_assignment_id).to eq(original.id)
    expect(original.reload.submission.answers.fetch("approach")).to eq("Original catalogue design")
    expect(original.reviews.sole.outcome).to eq("clarification_required")
    link = find_link("Open candidate assignment")[:href]
    expect(URI(link).fragment).to eq(replacement.access_token)
    submit_candidate(link, "Revised design with an extra request test")
    record_review(replacement)
    admin_page
    within('section[aria-label="Assignments"]') do
      select "Advance to interview", from: "Assignment action"
      fill_in "Decision reason", with: "Reviewed the submitted work and designated recommendation"
      click_button "Save assignment decision"
      expect(page).to have_text("Assignment decision saved.")
    end
    expect(application.reload.stage).to eq("interview")
    summary = find("h2", text: "Synthetic Review Candidate", exact_text: true).find(:xpath, "./ancestor::section")
    expect(summary).to have_text("Interview")
    expect(HiringMessage.count).to eq(0)
    expect(page.evaluate_script("document.documentElement.scrollWidth > window.innerWidth")).to be(false)
  ensure
    release_history = true
  end

  it "keeps stale Admin drafts and recovers an accepted issuance after its response is lost without duplicating work" do
    admin_page
    choose_task_and_reviewer
    fill_in "Candidate instructions", with: "My unsaved instructions"
    application.reload.update!(notes: "Another Admin updated the application")
    click_button "Issue assignment link"
    within('section[aria-label="Assignments"]') do
      expect(page).to have_text("This assessment changed")
      expect(page).to have_field("Candidate instructions", with: "My unsaved instructions")
      click_button "Reload saved state"
      expect(page).not_to have_text("Loading assignments…")
      expect(page).to have_field("Candidate instructions", with: "My unsaved instructions")
      click_button "Issue assignment link"
      expect(page).to have_text("This assessment changed")
      expect(HiringAssignment.count).to eq(0)
      click_button "Discard draft and reload"
      expect(page).to have_field("Candidate instructions", with: "")
    end
    choose_task_and_reviewer
    fill_in "Candidate instructions", with: "Instructions for the accepted request"
    lost = false
    requests = []
    allow_any_instance_of(Api::V1::Hiring::AssignmentsController).to receive(:create).and_wrap_original do |original|
      original.call
      controller = original.receiver
      requests << controller.params.require(:hiring_assignment).to_unsafe_h
      unless lost
        lost = true
        controller.response.status = 503
        controller.response.body = { errors: "Synthetic lost issue response after storage" }.to_json
      end
    end
    click_button "Issue assignment link"
    within('section[aria-label="Assignments"]') do
      expect(page).to have_text("Synthetic lost issue response after storage")
      expect(application.reload.hiring_assignments.count).to eq(1)
      expect(page).to have_field("Candidate instructions", with: "Instructions for the accepted request")
      click_button "Reload saved state"
      expect(page).to have_text("An assignment was saved for this request")
      expect(page).to have_link("Open candidate assignment")
      click_button "Issue assignment link"
      expect(page).to have_text("Assignment link created. No email was sent.")
    end
    expect(requests.size).to eq(2)
    expect(requests.last).to eq(requests.first)
    expect(application.reload.hiring_assignments.count).to eq(1)
    expect(application.hiring_assignments.sole.events.where(action: "issued").count).to eq(1)
  end

  it "reassigns through Admin controls, hides retained work after revocation and requires the new reviewer's recommendation" do
    record = submitted_assignment
    direct_review(record, "Original review evidence")
    alternate = create(:user, first_name: "Alternate", last_name: "Reviewer", current_workspace: company)
    alternate.add_role(:employee, company)
    alternate_membership = create(:employment, company:, user: alternate, resigned_at: nil)
    admin_page
    within('section[aria-label="Assignments"]') { select "Reassign reviewer", from: "Assignment action" }
    find("#assessment-reviewer").click
    find("[cmdk-item]", text: alternate.full_name).click
    fill_in "Decision reason", with: "Transfer this assessment to the active alternate reviewer"
    click_button "Save assignment decision"
    expect(page).to have_text("Assignment decision saved.")
    expect(record.reload.reviewer_employment_id).to eq(alternate_membership.id)
    expect(record.current_review).to be_nil
    expect(find("#assessment-action option[value='advance']")).to be_disabled
    sign_in reviewer
    visit "/assignment-reviews/#{record.id}"
    expect(page).to have_text("Review access is unavailable")
    expect(page).not_to have_text("Synthetic private contribution statement")
    visit "/assignment-reviews"
    expect(page).to have_text("No active assignments are designated to you")
    sign_in alternate
    visit "/assignment-reviews/#{record.id}"
    expect(page).to have_text("Synthetic private contribution statement")
    expect(page).to have_link("Assignment reviews", href: "/assignment-reviews")
    expect(page).not_to have_link("Hiring", exact: true)
    alternate_membership.update!(resigned_at: Date.yesterday)
    click_button "Reload saved review"
    expect(page).to have_text("Review access is unavailable")
    expect(page).not_to have_text("Synthetic private contribution statement")
    expect(page).not_to have_text("Synthetic Review Candidate")
    alternate_membership.update!(resigned_at: nil)
    record_review(record, actor: alternate)
    admin_page
    expect(find("#assessment-action option[value='advance']")).not_to be_disabled
    expect(record.reload.reviews.count).to eq(2)
    expect(record.reviews.order(:id).first.details.fetch("dimensions").values).to eq(["Original review evidence"] * 6)
  end

  it "keeps stale reviewer feedback across a saved-state refresh until it is explicitly discarded" do
    record = submitted_assignment
    sign_in reviewer
    visit "/assignment-reviews/#{record.id}"
    expect(page).to have_css("h1", text: "Assignment review")
    fill_review("My unsaved review evidence")
    select "Pass", from: "Recommendation"
    direct_review(record, "Concurrent saved review evidence")
    click_button "Record assessment review"
    expect(page).to have_text("This assessment changed")
    expect(page).to have_field("Correctness", with: "My unsaved review evidence")
    failed_read = false
    allow_any_instance_of(Api::V1::Hiring::AssignmentReviewsController).to receive(:show).and_wrap_original do |original|
      original.call
      unless failed_read
        failed_read = true
        original.receiver.response.status = 503
        original.receiver.response.body = { errors: "Synthetic temporary review read failure" }.to_json
      end
    end
    click_button "Reload saved review"
    expect(page).to have_text("Synthetic temporary review read failure")
    expect(page).to have_field("Correctness", with: "My unsaved review evidence")
    expect(page).to have_button("Reload saved review", disabled: false)
    click_button "Reload saved review"
    expect(page).to have_text("Concurrent saved review evidence")
    expect(page).to have_field("Correctness", with: "My unsaved review evidence")
    click_button "Record assessment review"
    expect(page).to have_text("This assessment changed")
    expect(record.reviews.count).to eq(1)
    click_button "Discard draft and reload"
    expect(page).to have_field("Correctness", with: "")
    fill_review("Fresh review after explicit discard")
    select "Pass", from: "Recommendation"
    click_button "Record assessment review"
    expect(page).to have_text("Review recorded. Admin decides the next step.")
    expect(record.reload.reviews.count).to eq(2)
  end

  it "records a failed recommendation and prepares rejection without sending candidate mail" do
    record = submitted_assignment
    record_review(record, outcome: "Fail")
    admin_page
    within('section[aria-label="Assignments"]') do
      select "Prepare rejection", from: "Assignment action"
      fill_in "Decision reason", with: "The submitted work did not meet the recorded assessment criteria"
      click_button "Save assignment decision"
      expect(page).to have_text("Assignment decision saved.")
    end
    expect(application.reload.stage).to eq("rejection_pending")
    expect(record.reload.ended_at).to be_present
    expect(record.current_review.outcome).to eq("fail")
    expect(HiringMessage.count).to eq(0)
  end

  it "cancels issued work without requiring a review or leaving the candidate link usable" do
    admin_page
    choose_task_and_reviewer
    click_button "Issue assignment link"
    expect(page).to have_text("Assignment link created. No email was sent.")
    record = application.reload.hiring_assignments.sole
    within('section[aria-label="Assignments"]') do
      select "Cancel assignment", from: "Assignment action"
      fill_in "Decision reason", with: "This candidate will follow a different screening path"
      click_button "Save assignment decision"
      expect(page).to have_text("Assignment decision saved.")
      expect(page).not_to have_link("Open candidate assignment")
    end
    expect(application.reload.stage).to eq("screening")
    expect(record.reload.status).to eq("cancelled")
    expect(record.candidate_access?(record.access_token)).to be(false)
    expect(HiringMessage.count).to eq(0)
  end
end
