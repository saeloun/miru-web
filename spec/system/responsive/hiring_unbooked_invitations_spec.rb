# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Unbooked interview invitation journeys", type: :system, js: true do
  include_context "interview message records"
  let(:company) { create(:company, name: "Synthetic Round Invite QA") }
  let(:candidate_name) { "Synthetic Invitation Candidate" }
  let(:panel) do
    HiringPanelMember.create!(company:, employment: staff, details: { "expertise" => "PRIVATE EXPERTISE",
      "availability" => "PRIVATE AVAILABILITY", "booking_url" => "https://calendar.example.test/book" })
  end

  before do
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
  end
  after { expect(@console_errors).to eq([]) }

  around do |example|
    original = Api::V1::Hiring::BaseController.allow_forgery_protection
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = original
  end

  def open_invitation(width: 375)
    approve
    round
    mailbox
    sign_in admin
    page.current_window.resize_to(width, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_current_path("/hiring/applications/#{application.id}")
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "View interview rounds"
    expect(page).to have_css("h4", text: "Round 1 · Project discussion")
    click_button "Candidate messages for round 1"
    expect(page).to have_text("No messages recorded for this round.")
    choose_inbox
    click_button "Preview candidate message"
    expect(page).to have_text("Confirm candidate message")
  end

  def choose_inbox
    click_button "Choose enabled inbox"
    find("[cmdk-item]", text: "Hiring", match: :first).click
  end

  def update_round_in_browser
    click_button "Edit round 1"
    fill_in "Candidate preparation", with: "Bring the updated project"
    click_button "Save interview round"
    expect(page).not_to have_field("Candidate preparation")
    expect(page).to have_text("Bring the updated project")
    expect(page).to have_button("Hide round 1")
    expect(page).to have_text("Earlier round details")
  end

  def capture(name)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_UNBOOKED_SHOTS"]

    directory = Rails.root.join(ENV.fetch("HIRING_UNBOOKED_SHOTS"))
    FileUtils.mkdir_p(directory)
    page.save_screenshot(directory.join("#{name}.png"), full: true)
  end

  it "previews public booking links and queues an invitation without a meeting" do
    open_invitation
    within('section[aria-label="Candidate messages for round 1"]') do
      expect(page).to have_text("No interview time is confirmed")
      expect(page).to have_text("https://calendar.example.test/book")
      expect(page).not_to have_text("PRIVATE")
      expect(page).not_to have_select("Message type", with_options: ["Interview confirmation"])
    end
    capture("unbooked-invitation-preview-mobile")
    click_button "Confirm and queue message"
    expect(page).to have_text("Message recorded. Check delivery history")
    expect(page).to have_text("Current round details")
    expect(HiringMessage.count).to eq(1)
    expect(HiringInterviewBooking.count).to eq(0)
    capture("unbooked-invitation-queued-mobile")
  end

  it "retains stale preview terms until explicit discard and another preview" do
    open_invitation
    change_round
    click_button "Confirm and queue message"
    expect(page).to have_css('[role="alert"]', text: "changed")
    expect(HiringMessage.count).to eq(0)
    within('section[aria-label="Candidate messages for round 1"]') { expect(page).to have_text("Preparation: Bring a project") }
    capture("unbooked-invitation-stale-mobile")
    click_button "Discard preview"
    click_button "Preview candidate message"
    within('section[aria-label="Candidate messages for round 1"]') { expect(page).to have_text("Bring an updated project") }
  end

  it "sends updated details after a real round edit and retains the earlier queued snapshot" do
    open_invitation(width: 1440)
    click_button "Confirm and queue message"
    expect(page).to have_text("Attempt 1")
    original = HiringMessage.sole
    update_round_in_browser
    click_button "Preview candidate message"
    click_button "Confirm and queue message"
    expect(page).to have_text("Current round details")
    expect(page).to have_text("Earlier round details")
    expect(original.reload.state).to eq("failed")
    expect(original.content.fetch("body")).to include("Preparation: Bring a project")
    expect(HiringMessage.operations.count).to eq(2)
    expect(HiringInterviewBooking.count).to eq(0)
    capture("unbooked-invitation-revised-desktop")
  end

  it "requires evidence for an earlier unknown delivery before another revised invitation" do
    open_invitation
    click_button "Confirm and queue message"
    expect(page).to have_text("Attempt 1")
    original = HiringMessage.sole
    original.update!(state: "uncertain", error_code: "transport_unknown")
    update_round_in_browser
    click_button "Preview candidate message"
    expect(page).to have_css('[role="alert"]', text: "earlier invitation")
    expect(HiringMessage.count).to eq(1)
    click_button "Review unknown attempt 1"
    select "Not accepted", from: "Verified delivery outcome"
    fill_in "Delivery evidence", with: "Verified synthetic capture and stopped worker"
    check "Original worker has stopped and cannot resume"
    click_button "Record delivery evidence"
    expect(page).to have_text("No new message was sent")
    click_button "Preview candidate message"
    click_button "Confirm and queue message"
    expect(page).to have_text("Current round details")
    expect(HiringMessage.operations.count).to eq(2)
    capture("unbooked-invitation-reviewed-mobile")
  end

  it "clears the whole candidate view when Admin employment ends" do
    open_invitation
    membership.update!(resigned_at: Date.yesterday)
    click_button "Confirm and queue message"
    expect(page).to have_text("You are not authorized")
    expect(page).not_to have_text(candidate_name)
    expect(page).not_to have_text("candidate@example.test")
    expect(page).not_to have_text("PRIVATE ADMIN NOTE")
    expect(HiringMessage.count).to eq(0)
    capture("unbooked-invitation-revoked-mobile")
  end
end
