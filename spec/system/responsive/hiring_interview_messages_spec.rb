# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Interview candidate communication journeys", type: :system, js: true do
  include_context "interview message records"
  let(:company) { create(:company, name: "Synthetic Interview Mail QA") }
  let(:candidate_name) { "Synthetic Interview Candidate" }

  before do
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

  after { expect(@console_errors).to eq([]) }

  def open_messages(width: 375)
    approve
    booking
    mailbox
    sign_in admin
    page.current_window.resize_to(width, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_current_path("/hiring/applications/#{application.id}")
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "View interview rounds"
    expect(page).to have_css("h4", text: "Round 1 · Project discussion")
    click_button "Manage booking for round 1"
    click_button "Candidate messages for booking 1"
    expect(page).to have_text("No messages recorded for this booking.")
    click_button "Choose enabled inbox"
    find("[cmdk-item]", text: "Hiring", match: :first).click
    click_button "Preview candidate message"
    expect(page).to have_text("Confirm candidate message")
  end

  def capture(name)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_INTERVIEW_MESSAGE_SHOTS"]

    directory = Rails.root.join(ENV.fetch("HIRING_INTERVIEW_MESSAGE_SHOTS"))
    FileUtils.mkdir_p(directory)
    page.save_screenshot(directory.join("#{name}.png"), full: true)
  end

  it "previews the exact candidate email and records one queued operation on mobile" do
    open_messages
    within('section[aria-label="Candidate messages for booking 1"]') do
      expect(page).to have_text("candidate@example.test")
      expect(page).to have_text("2026-11-09 14:30:00 +05:30")
      expect(page).not_to have_text("PRIVATE")
    end
    capture("interview-message-preview-mobile")
    click_button "Confirm and queue message"
    expect(page).to have_text("Message recorded. Check delivery history")
    expect(page).to have_text("Attempt 1")
    expect(HiringMessage.count).to eq(1)
    expect(HiringMessage.sole.content.fetch("body")).not_to include("PRIVATE")
    capture("interview-message-queued-mobile")
  end

  it "preserves stale approved wording until an explicit discard and fresh preview" do
    open_messages
    setting = company.hiring_setting.reload
    setting.update!(details: setting.details.merge("interview_invitation_body" => "New approved invitation wording"))
    setting.update!(approved_at: Time.current, approved_by: admin)
    click_button "Confirm and queue message"
    expect(page).to have_css('[role="alert"]', text: "changed")
    expect(page).to have_text("Please review these interview details.")
    expect(HiringMessage.count).to eq(0)
    capture("interview-message-stale-mobile")
    click_button "Discard preview"
    click_button "Preview candidate message"
    expect(page).to have_text("New approved invitation wording")
  end

  it "recovers a lost queue response without another message" do
    intercepted = false
    allow_any_instance_of(Api::V1::Hiring::InterviewMessagesController).to receive(:create).and_wrap_original do |original, *arguments|
      original.call(*arguments)
      unless intercepted
        intercepted = true
        controller = original.receiver
        controller.response.status = 503
        controller.response_body = { errors: "Synthetic lost accepted queue response" }.to_json
      end
    end
    open_messages
    click_button "Confirm and queue message"
    expect(page).to have_text("Synthetic lost accepted queue response")
    click_button "Confirm and queue message"
    expect(page).to have_text("Message recorded. Check delivery history")
    expect(HiringMessage.count).to eq(1)
  end

  it "clears the private preview when Admin employment ends" do
    open_messages
    membership.update!(resigned_at: Date.yesterday)
    click_button "Confirm and queue message"
    expect(page).to have_text("You are not authorized")
    expect(page).not_to have_text("candidate@example.test")
    expect(page).not_to have_text(candidate_name)
    expect(page).not_to have_text("PRIVATE ADMIN NOTE")
    expect(page).not_to have_text("PRIVATE CRITERIA")
    expect(page).not_to have_text("Please review these interview details.")
    expect(HiringMessage.count).to eq(0)
    capture("interview-message-revoked-mobile")
  end

  it "records unknown delivery evidence separately from an explicit retry" do
    open_messages(width: 1440)
    click_button "Confirm and queue message"
    expect(page).to have_text("Attempt 1")
    message = HiringMessage.sole
    message.update!(state: "uncertain", error_code: "transport_unknown")
    click_button "Refresh message history"
    click_button "Review unknown attempt 1"
    select "Not accepted", from: "Verified delivery outcome"
    fill_in "Delivery evidence", with: "Verified synthetic mail capture and stopped worker"
    expect(page).to have_button("Record delivery evidence", disabled: true)
    check "Original worker has stopped and cannot resume"
    click_button "Record delivery evidence"
    expect(page).to have_text("Delivery evidence recorded. No new message was sent.")
    expect(HiringMessage.count).to eq(1)
    click_button "Preview retry for attempt 1"
    expect(page).to have_text("Confirm retry after attempt 1")
    click_button "Confirm and queue retry"
    expect(page).to have_text("Attempt 2")
    expect(HiringMessage.count).to eq(2)
    capture("interview-message-retry-desktop")
  end

  ["Reload screening", "Reload saved state", "Refresh forms"].each do |button|
    it "clears the whole application after denied #{button.downcase}" do
      open_messages
      membership.update!(resigned_at: Date.yesterday)
      click_button button
      expect(page).to have_text("You are not authorized")
      expect(page).not_to have_text(candidate_name)
      expect(page).not_to have_text("candidate@example.test")
      expect(page).not_to have_text("PRIVATE ADMIN NOTE")
      expect(page).not_to have_text("Please review these interview details.")
    end
  end

  it "edits interview wording through the saved settings and requires approval again" do
    approve
    sign_in admin
    page.current_window.resize_to(375, 900)
    visit "/hiring"
    click_link "Communication settings"
    fill_in "Interview invitation subject", with: "Synthetic invitation subject"
    fill_in "Interview invitation body", with: "Synthetic approved invitation wording"
    expect(page).to have_button("Approve communications", disabled: true)
    click_button "Save draft"
    expect(page).to have_text("Draft saved")
    expect(company.hiring_setting.reload.approved?).to be(false)
    click_button "Approve communications"
    expect(page).to have_text("Approved. New applications")
    expect(company.hiring_setting.reload.details.fetch("interview_invitation_subject")).to eq("Synthetic invitation subject")
    expect(company.hiring_setting.approved?).to be(true)
    capture("interview-message-settings-mobile")
  end
end
