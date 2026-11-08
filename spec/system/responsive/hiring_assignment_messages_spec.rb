# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Assignment email journeys", type: :system, js: true do
  include_context "assignment message records"
  include_context "hiring SMTP transport"
  let(:company) { create(:company, name: "Synthetic Assignment Email QA") }
  let(:candidate_name) { "Synthetic Assignment Email Candidate" }

  before do
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    sign_in admin
    allow(Rails.application.config.action_mailer).to receive(:default_url_options)
      .and_return({ host: Capybara.server_host, port: Capybara.server_port, protocol: "http" })
  end

  around do |example|
    controllers = [Api::V1::Hiring::BaseController, HiringAssignmentPortalController]
    originals = controllers.index_with(&:allow_forgery_protection)
    controllers.each { |controller| controller.allow_forgery_protection = true }
    with_forgery_protection { example.run }
  ensure
    originals.each { |controller, value| controller.allow_forgery_protection = value }
  end

  after { expect(@console_errors).to eq([]) }

  def capture(name)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_ASSIGNMENT_MAIL_SHOTS"]

    folder = Rails.root.join(ENV.fetch("HIRING_ASSIGNMENT_MAIL_SHOTS"))
    FileUtils.mkdir_p(folder)
    page.save_screenshot(folder.join("#{name}.png"), full: true)
  end

  def open_messages(width: 1440)
    assignment
    page.current_window.resize_to(width, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "Candidate messages for assignment #{assignment.id}"
    expect(page).to have_css("h5", text: "Candidate messages")
  end

  def preview_message
    click_button "Choose enabled inbox"
    find("[cmdk-item]", text: "Hiring · #{mailbox.source_email}", exact_text: true).click
    click_button "Preview candidate message"
    expect(page).to have_button("Confirm and queue message", disabled: false)
  end

  it "edits and approves assignment email wording without sending on task issuance" do
    approve
    mailbox
    visit "/hiring"
    click_link "Communication settings"
    expect(page).to have_css("h2", text: "Hiring communications")
    fill_in "Assignment subject", with: "Your approved practical task"
    fill_in "Assignment body", with: "Read the task and disclose assistance before submitting."
    click_button "Save draft"
    expect(page).to have_text("Draft saved")
    expect(company.reload.hiring_setting).not_to be_approved
    click_button "Approve communications"
    expect(page).to have_text("Approved for new applications")
    open_messages(width: 375)
    preview_message
    expect(page).to have_text("Your approved practical task")
    expect(page).to have_text("Read the task and disclose assistance before submitting.")
    expect(HiringMessage.count).to eq(0)
    capture("assignment-mail-approved-preview-mobile")
  end

  it "sends one actual SMTP message and opens its exact private assignment link" do
    approve_assignment_messages
    open_messages
    preview_message
    within("section[aria-label='Candidate messages for assignment #{assignment.id}']") do
      expect(page).to have_text("Catalogue assessment")
      expect(page).to have_no_text("PRIVATE")
      expect(page).to have_no_text(interviewer.email)
    end
    capture("assignment-mail-preview-desktop")
    click_button "Confirm and queue message"
    expect(page).to have_text("Attempt 1")
    record = HiringMessage.sole
    emailed_link = nil
    with_smtp_response do |commands, messages|
      2.times { HiringDeliveryJob.perform_now(record.id) }
      expect(commands.count("DATA")).to eq(1)
      payload = Mail.read_from_string(messages.sole)
      expect(payload.to).to eq([application.hiring_candidate.email])
      expect(payload.subject).to eq("Your practical assignment")
      expect(payload.body.decoded).not_to include("PRIVATE", interviewer.email)
      emailed_link = payload.body.decoded[%r{http://[^\s]+/hiring-assignment\#[A-Za-z0-9]+}]
      expect(emailed_link).to be_present
    end
    expect(record.reload.state).to eq("sent")
    click_button "Refresh message history"
    expect(page).to have_text("Accepted by mail transport")
    capture("assignment-mail-delivered-desktop")
    page.current_window.resize_to(375, 900)
    visit emailed_link
    expect(page).to have_css("h1", text: "Catalogue assessment")
    expect(page.current_url).not_to include(assignment.access_token)
    expect(page).to have_no_text("PRIVATE")
    capture("assignment-mail-private-portal-mobile")
  end

  it "keeps unknown review separate from a confirmed retry and blocks later submitted work" do
    approve_assignment_messages
    communication = Hiring::AssignmentCommunication.new(assignment:, actor: admin)
    record, = communication.queue!(attributes: communication.preview!(kind: "assignment", mailbox_id: mailbox.id).fetch("intent"))
    record.update!(state: "uncertain", error_code: "transport_unknown")
    open_messages(width: 375)
    click_button "Review unknown attempt 1"
    select "Not accepted", from: "Verified delivery outcome"
    fill_in "Delivery evidence", with: "Local capture confirms no DATA and the worker has returned."
    expect(page).to have_button("Record delivery evidence", disabled: true)
    check "Original worker has stopped and cannot resume"
    click_button "Record delivery evidence"
    expect(page).to have_text("Delivery evidence recorded. No new message was sent.")
    expect(HiringMessage.count).to eq(1)
    click_button "Choose enabled inbox"
    find("[cmdk-item]", text: "Hiring · #{mailbox.source_email}", exact_text: true).click
    click_button "Preview retry for attempt 1"
    expect(page).to have_text("Confirm retry after attempt 1")
    expect(HiringMessage.count).to eq(1)
    capture("assignment-mail-retry-preview-mobile")
    click_button "Confirm and queue retry"
    expect(page).to have_text("Attempt 2")
    submit_assignment
    retry_record = record.attempts.find_by!(attempt_number: 2)
    HiringDeliveryJob.perform_now(retry_record.id)
    expect(retry_record.reload.state).to eq("failed")
    expect(record.reload.resolution).to eq("not_accepted")
    click_button "Refresh message history"
    capture("assignment-mail-submitted-block-mobile")
  end

  it "clears the entire private application after Admin access ends" do
    approve_assignment_messages
    open_messages(width: 375)
    preview_message
    membership.update!(resigned_at: Date.yesterday)
    click_button "Confirm and queue message"
    expect(page).to have_css('[role="alert"]', text: /authorized|Forbidden/i)
    expect(page).to have_no_text(candidate_name)
    expect(page).to have_no_text("PRIVATE ADMIN NOTE")
    expect(page).to have_no_text("Catalogue assessment")
    expect(HiringMessage.count).to eq(0)
    capture("assignment-mail-access-denied-mobile")
  end
end
