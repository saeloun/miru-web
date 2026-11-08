# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Internal feedback notice journeys", type: :system, js: true do
  include_context "interview message records"
  include_context "hiring SMTP transport"
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
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
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
    click_button "Internal feedback notices for feedback #{booking.hiring_feedbacks.sole.id}"
    expect(page).to have_css("h5", text: "Internal feedback notices")
    expect(page).to have_button("Refresh message history", disabled: false)
  end

  def choose_reply_inbox
    click_button "Choose enabled inbox"
    find("[cmdk-item]", text: "Hiring · #{mailbox.source_email}", exact_text: true).click
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
    within('section[aria-label="Internal feedback delivery history"]') do
      expect(page).to have_text("Queued")
      expect(page).to have_text(interviewer.email)
      expect(page).to have_text("Feedback due (UTC)")
      expect(page).not_to have_text("PRIVATE")
      expect(page).to have_no_field("Message type")
      expect(page).to have_no_button("Preview candidate message")
      expect(page).to have_no_button("Confirm and queue message")
    end
    capture("feedback-notices-queued-desktop")
  end

  it "shows unknown delivery clearly on mobile without offering an automatic resend" do
    enable_feedback_notifications
    travel_to(booking.feedback_due_at + 1.second)
    HiringFeedbackRequestsJob.perform_now
    HiringMessage.sole.update!(state: "uncertain", started_at: Time.current, error_code: "transport_unknown")
    open_history(width: 375)
    expect(page).to have_text("Internal notices are not resent automatically")
    expect(page).to have_button("Review unknown attempt 1")
    expect(page).to have_no_button("Preview retry for attempt 1")
    capture("feedback-notices-uncertain-mobile")
  end

  it "records acceptance evidence for an ambiguous actual SMTP delivery without sending another notice" do
    enable_feedback_notifications
    travel_to(booking.ends_at + 1.minute)
    HiringFeedbackRequestsJob.perform_now
    message = HiringMessage.sole
    with_smtp_response(quit_status: 500) do |commands, messages|
      HiringDeliveryJob.perform_now(message.id)
      expect(message.reload).to have_attributes(state: "uncertain", error_code: "transport_unknown")
      expect(commands.count("DATA")).to eq(1)
      payload = Mail.read_from_string(messages.sole)
      expect(payload.to).to eq([interviewer.email])
      expect(payload.subject).to eq("Approved feedback_prompt")
      expect(payload.body.decoded).to include(candidate_name, "Feedback due (UTC)")
      expect(payload.body.decoded).not_to include("PRIVATE")
    end
    open_history(width: 375)
    click_button "Review unknown attempt 1"
    select "Accepted by mail transport", from: "Verified delivery outcome"
    fill_in "Delivery evidence", with: "Local SMTP captured one DATA payload and returned 250 Accepted; QUIT failed."
    click_button "Record delivery evidence"
    expect(page).to have_text("Delivery evidence recorded. No new message was sent.")
    expect(page).to have_text("Verified outcome: Accepted")
    expect(page).to have_no_button("Preview retry for attempt 1")
    expect(message.reload.resolution).to eq("accepted")
    expect(HiringMessage.count).to eq(1)
    2.times { HiringDeliveryRecoveryJob.perform_now }
    HiringDeliveryJob.perform_now(message.id)
    expect(HiringMessage.count).to eq(1)
    expect(message.reload.state).to eq("uncertain")
    capture("feedback-notices-accepted-evidence-mobile")
  end

  it "requires stopped-worker evidence and a separately confirmed preview before one actual SMTP retry" do
    enable_feedback_notifications
    travel_to(booking.ends_at + 1.minute)
    HiringFeedbackRequestsJob.perform_now
    message = HiringMessage.sole
    frozen_content = message.content.deep_dup
    with_smtp_response(reject_mail: true) do |commands, messages|
      HiringDeliveryJob.perform_now(message.id)
      expect(message.reload.state).to eq("uncertain")
      expect(commands).not_to include("DATA")
      expect(messages).to be_empty
    end
    open_history(width: 1440)
    click_button "Review unknown attempt 1"
    select "Not accepted", from: "Verified delivery outcome"
    fill_in "Delivery evidence", with: "Local SMTP rejected MAIL before DATA; the original synchronous worker has returned."
    expect(page).to have_button("Record delivery evidence", disabled: true)
    check "Original worker has stopped and cannot resume"
    click_button "Record delivery evidence"
    expect(page).to have_text("Delivery evidence recorded. No new message was sent.")
    expect(HiringMessage.count).to eq(1)
    expect(page).to have_button("Preview retry for attempt 1", disabled: true)
    choose_reply_inbox
    click_button "Preview retry for attempt 1"
    expect(page).to have_text("Confirm retry after attempt 1")
    expect(page).to have_button("Confirm and queue retry", disabled: false)
    expect(HiringMessage.count).to eq(1)
    capture("feedback-notices-retry-preview-desktop")
    click_button "Confirm and queue retry"
    expect(page).to have_text("Attempt 2")
    retry_record = message.attempts.find_by!(attempt_number: 2)
    with_smtp_response do |commands, messages|
      2.times { HiringDeliveryJob.perform_now(retry_record.id) }
      expect(commands.count("DATA")).to eq(1)
      payload = Mail.read_from_string(messages.sole)
      expect(payload.to).to eq([interviewer.email])
      expect(payload.subject).to eq(frozen_content.fetch("subject"))
      expect(payload.body.decoded.gsub("\r\n", "\n").strip.b).to eq(frozen_content.fetch("body").strip.b)
    end
    expect(retry_record.reload.state).to eq("sent")
    expect(message.reload.content).to eq(frozen_content)
    click_button "Refresh message history"
    expect(page).to have_text("Accepted by mail transport")
    expect(HiringMessage.count).to eq(2)
    capture("feedback-notices-retry-delivered-desktop")
  end

  it "clears the entire private application after removed Admin access or a workspace mismatch" do
    enable_feedback_notifications
    travel_to(booking.ends_at + 1.minute)
    HiringFeedbackRequestsJob.perform_now
    open_history(width: 375)
    expect(page).to have_text(candidate_name)
    admin.remove_role(:admin, company)
    click_button "Refresh message history"
    expect(page).to have_css('[role="alert"]', text: /authorized|Forbidden/i)
    expect(page).to have_no_text(candidate_name)
    expect(page).to have_no_text("PRIVATE ADMIN NOTE")
    expect(page).to have_no_text(interviewer.email)
    expect(page).to have_no_text("Approved feedback_prompt")
    capture("feedback-notices-admin-denied-mobile")
    admin.add_role(:admin, company)
    open_history(width: 375)
    allow_any_instance_of(Api::V1::Hiring::FeedbackMessagesController).to receive(:index) do |controller|
      controller.render(json: { company_id: company.id + 1, messages: [], pagination: { page: 1, per_page: 20, has_more: false } })
    end
    click_button "Refresh message history"
    expect(page).to have_css('[role="alert"]', text: "The hiring workspace changed")
    expect(page).to have_no_text(candidate_name)
    expect(page).to have_no_text("PRIVATE ADMIN NOTE")
    expect(page).to have_no_text(interviewer.email)
    expect(page).to have_no_text("Approved feedback_prompt")
    capture("feedback-notices-workspace-denied-mobile")
  end
end
