# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Internal feedback notice journeys", type: :system, js: true do
  include_context "interview message records"
  let(:company) { create(:company, name: "Synthetic Feedback Notices QA") }
  let(:candidate_name) { "Synthetic Feedback Candidate" }

  before do
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    sign_in admin
  end

  around do |example|
    original = Api::V1::Hiring::BaseController.allow_forgery_protection
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = original
  end

  after { expect(@console_errors).to eq([]) }

  def capture(name)
    return unless ENV["HIRING_FEEDBACK_NOTICE_SHOTS"]

    directory = Rails.root.join(ENV.fetch("HIRING_FEEDBACK_NOTICE_SHOTS"))
    FileUtils.mkdir_p(directory)
    page.save_screenshot(directory.join("#{name}.png"), full: true)
  end

  def open_history(width:)
    page.current_window.resize_to(width, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_current_path("/hiring/applications/#{application.id}")
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "View interview rounds"
    expect(page).to have_css("h4", text: "Round 1 · Project discussion")
    click_button "View feedback for round 1"
    expect(page).to have_css('section[aria-label="Internal feedback delivery history"]')
  end

  it "requires explicit templates, inbox and approval to enable notices from the browser" do
    approve
    mailbox
    visit "/hiring"
    click_link "Communication settings"
    expect(page).to have_css("h2", text: "Hiring communications")
    expect(find_field("Enable automatic internal feedback notices")).not_to be_checked
    check "Enable automatic internal feedback notices"
    click_button "Save draft"
    expect(page).to have_css('[role="alert"]', text: "valid")
    expect(company.reload.hiring_setting.feedback_notifications_started_at).to be_nil
    HiringMessage::FEEDBACK_KINDS.each do |kind|
      fill_in "hiring-setting-#{kind}_subject", with: "Approved #{kind}"
      fill_in "hiring-setting-#{kind}_body", with: "Open Hiring to review the interview."
    end
    click_button "Choose internal feedback inbox"
    find("[cmdk-item]", text: "Hiring · #{mailbox.source_email}", exact_text: true).click
    click_button "Save draft"
    expect(page).to have_text("Draft saved")
    expect(company.reload.hiring_setting.feedback_notifications_started_at).to be_nil
    click_button "Approve communications"
    expect(page).to have_text("Internal feedback notices run only when enabled below")
    expect(company.reload.hiring_setting.feedback_notifications_started_at).to be_present
    expect(HiringMessage.count).to eq(0)
    capture("feedback-notices-approved-desktop")
  end

  it "shows the frozen queued mail to Admins on desktop without internal assessment data" do
    enable_feedback_notifications
    travel_to(booking.ends_at + 1.minute)
    HiringFeedbackRequestsJob.perform_now
    open_history(width: 1440)
    find("summary", text: "Approved feedback_prompt").click
    within('section[aria-label="Internal feedback delivery history"]') do
      expect(page).to have_text("Queued")
      expect(page).to have_text(interviewer.email)
      expect(page).to have_text("Feedback due (UTC)")
      expect(page).not_to have_text("PRIVATE")
    end
    capture("feedback-notices-queued-desktop")
  end

  it "shows unknown delivery clearly on mobile without offering an automatic resend" do
    enable_feedback_notifications
    travel_to(booking.feedback_due_at + 1.second)
    HiringFeedbackRequestsJob.perform_now
    HiringMessage.sole.update!(state: "uncertain", started_at: Time.current, error_code: "transport_unknown")
    open_history(width: 375)
    find("summary", text: "Approved feedback_overdue").click
    expect(page).to have_text("This notice will not be resent automatically")
    expect(page).to have_no_button("Retry")
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    capture("feedback-notices-uncertain-mobile")
  end
end
