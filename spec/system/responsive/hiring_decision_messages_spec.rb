# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Decision communication journeys", type: :system, js: true do
  include_context "interview message records"
  include_context "hiring SMTP transport"
  let(:company) { create(:company, name: "Synthetic Decision Delivery QA") }
  let(:candidate_name) { "Synthetic Decision Candidate" }

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

  def finalize(outcome: "reject", date: nil)
    service = Hiring::Decisions.new(application:, actor: admin)
    record, = service.create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => outcome, "reason" => "PRIVATE DECISION REASON", "owner_employment_id" => outcome == "hold" ? staff.id : nil,
      "follow_up_on" => date })
    service.finalize!(decision: record, attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version, "decision_version" => record.lock_version })
  end

  def open_history(width: 1440)
    page.current_window.resize_to(width, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_current_path("/hiring/applications/#{application.id}")
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "Review decisions"
    expect(page).to have_css("h5", text: /Decision #\d+ · Finalized/)
  end

  def open_message(record, width: 1440)
    open_history(width:)
    click_button "Candidate messages for decision #{record.id}"
    expect(page).to have_text("No messages recorded for this decision.")
    click_button "Choose enabled inbox"
    find("[cmdk-item]", text: "Hiring · #{mailbox.source_email}").click
    click_button "Preview candidate message"
    expect(page).to have_button("Confirm and queue message")
  end

  def capture(name)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_DECISION_MESSAGE_SHOTS"]

    folder = Rails.root.join(ENV.fetch("HIRING_DECISION_MESSAGE_SHOTS"))
    FileUtils.mkdir_p(folder)
    page.save_screenshot(folder.join("#{name}.png"), full: true)
  end

  it "previews the approved rejection, queues it explicitly and captures its actual local SMTP delivery" do
    approve_decision_messages
    record = finalize
    open_message(record)
    within("section[aria-label='Candidate messages for decision #{record.id}']") do
      expect(page).to have_text("We will not proceed")
      expect(page).not_to have_text("PRIVATE")
    end
    capture("rejection-approved-preview-desktop")
    click_button "Confirm and queue message"
    expect(page).to have_text("Message recorded. Check delivery history")
    with_smtp_response do |commands, messages|
      HiringDeliveryJob.perform_now(HiringMessage.sole.id)
      expect(commands.count("DATA")).to eq(1)
      mail = Mail.read_from_string(messages.sole)
      expect(mail.to).to eq(["candidate@example.test"])
      expect(mail.body.decoded).to include("We will not proceed")
      expect(mail.body.decoded).not_to include("PRIVATE")
    end
    expect(HiringMessage.sole.state).to eq("sent")
    click_button "Refresh message history"
    expect(page).to have_text("Accepted by mail server")
    capture("rejection-smtp-sent-desktop")
  end

  it "prepares approved wording on a draft but enables queueing only after explicit finalization" do
    approve_decision_messages
    service = Hiring::Decisions.new(application:, actor: admin)
    record, = service.create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => "reject", "reason" => "PRIVATE DRAFT DECISION", "owner_employment_id" => nil, "follow_up_on" => nil })
    page.current_window.resize_to(375, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "Review decisions"
    expect(page).to have_css("h5", text: /Decision #\d+ · Draft/)
    click_button "Candidate messages for decision #{record.id}"
    click_button "Choose enabled inbox"
    find("[cmdk-item]", text: "Hiring · #{mailbox.source_email}").click
    click_button "Preview candidate message"
    expect(page).to have_text("Draft preview only")
    expect(page).to have_button("Confirm and queue message", disabled: true)
    expect(HiringMessage.count).to eq(0)
    capture("rejection-draft-prepared-mobile")
    check "I confirm this final decision"
    click_button "Finalize saved decision"
    expect(page).to have_text("This application is closed. Its decision history is read-only.")
    click_button "Candidate messages for decision #{record.id}"
    click_button "Choose enabled inbox"
    find("[cmdk-item]", text: "Hiring · #{mailbox.source_email}").click
    click_button "Preview candidate message"
    expect(page).to have_button("Confirm and queue message", disabled: false)
    click_button "Confirm and queue message"
    expect(page).to have_text("Attempt 1")
    expect(HiringMessage.count).to eq(1)
    capture("rejection-finalization-confirmed-mobile")
  end

  it "suggests rejection review for a pending application without copying feedback or making a decision" do
    application.update!(stage: "rejection_pending")
    visit "/hiring/applications/#{application.id}"
    click_button "Review decisions"
    expect(page).to have_select("Decision outcome", selected: "Reject")
    expect(page).to have_field("Internal decision reason", with: "")
    expect(company.hiring_decisions.count).to eq(0)
    expect(HiringMessage.count).to eq(0)
  end

  it "preserves stale approved wording until a fresh preview on mobile" do
    setting = approve_decision_messages
    record = finalize
    open_message(record, width: 375)
    configure = Hiring::Configure.new(company:, actor: admin)
    setting = configure.save_draft!(details: setting.details.merge("rejection_body" => "New approved candidate wording"), lock_version: setting.lock_version)
    configure.approve!(lock_version: setting.lock_version)
    click_button "Confirm and queue message"
    expect(page).to have_css('[role="alert"]', text: "changed")
    expect(page).to have_text("We will not proceed")
    expect(HiringMessage.count).to eq(0)
    capture("rejection-stale-preview-mobile")
    click_button "Discard preview"
    click_button "Preview candidate message"
    expect(page).to have_text("New approved candidate wording")
  end

  it "shows a due-hold notice and its unknown-delivery warning without leaking the reason into mail" do
    approve_decision_messages(holds: true)
    finalize(outcome: "hold", date: "2026-11-03")
    HiringDecisionNotificationsJob.perform_now
    message = HiringMessage.sole
    message.update!(state: "uncertain", error_code: "transport_unknown", started_at: Time.current)
    open_history(width: 375)
    within('section[aria-label="Hold follow-up delivery history"]') do
      find("summary", text: "Hiring follow-up due").click
      expect(page).to have_text(admin.email)
      expect(page).to have_text("This notice will not be resent automatically")
      expect(page).not_to have_text("PRIVATE")
    end
    capture("hold-unknown-delivery-mobile")
  end

  it "reconciles an unknown rejection on the closed application before a separate explicit retry" do
    approve_decision_messages
    record = finalize
    open_message(record, width: 375)
    click_button "Confirm and queue message"
    expect(page).to have_text("Attempt 1")
    message = HiringMessage.sole
    message.update!(state: "uncertain", error_code: "transport_unknown", started_at: Time.current)
    click_button "Refresh message history"
    click_button "Review unknown attempt 1"
    select "Not accepted", from: "Verified delivery outcome"
    fill_in "Delivery evidence", with: "Synthetic local capture confirms non-acceptance; original worker stopped."
    expect(page).to have_button("Record delivery evidence", disabled: true)
    check "Original worker has stopped and cannot resume"
    click_button "Record delivery evidence"
    expect(page).to have_text("Delivery evidence recorded. No new message was sent.")
    expect(HiringMessage.count).to eq(1)
    capture("rejection-uncertain-reviewed-mobile")
    click_button "Preview retry for attempt 1"
    expect(page).to have_text("Confirm retry after attempt 1")
    click_button "Confirm and queue retry"
    expect(page).to have_text("Attempt 2")
    expect(HiringMessage.count).to eq(2)
    expect(HiringMessage.last.original_message_id).to eq(message.id)
    expect(application.reload.stage).to eq("rejected")
    capture("rejection-explicit-retry-mobile")
  end

  it "requires explicit approval before enabling automation from the settings screen" do
    approve
    mailbox
    visit "/hiring"
    click_link "Communication settings"
    expect(page).to have_css("h2", text: "Hiring communications")
    expect(find_field("Enable automatic rejection after final Admin decision")).not_to be_checked
    check "Enable automatic rejection after final Admin decision"
    fill_in "Rejection subject", with: "Application update"
    fill_in "Rejection body", with: "Thank you for your time. We will not proceed."
    click_button "Choose decision inbox"
    find("[cmdk-item]", text: "Hiring · #{mailbox.source_email}").click
    click_button "Save draft"
    expect(page).to have_text("Draft saved")
    expect(company.reload.hiring_setting.rejection_automation_started_at).to be_nil
    click_button "Approve communications"
    expect(page).to have_text("Approved for new applications")
    expect(company.reload.hiring_setting.rejection_automation_started_at).to be_present
    travel 1.second
    record = finalize
    HiringDecisionNotificationsJob.perform_now
    open_history
    click_button "Candidate messages for decision #{record.id}"
    expect(page).to have_text("Automatic approved delivery")
    expect(HiringMessage.count).to eq(1)
    capture("rejection-automation-approved-desktop")
  end

  it "clears candidate identity and private sibling panels after a scoped mail denial" do
    approve_decision_messages
    record = finalize
    open_message(record)
    allow_any_instance_of(Api::V1::Hiring::DecisionMessagesController).to receive(:index).and_raise(Pundit::NotAuthorizedError)
    click_button "Refresh message history"
    expect(page).to have_css('[role="alert"]', text: /authorized|Forbidden/i)
    expect(page).to have_no_text("Synthetic Decision Candidate")
    expect(page).to have_no_text("PRIVATE ADMIN NOTE")
    expect(page).to have_no_text("PRIVATE DECISION REASON")
    capture("rejection-permission-denied-desktop")
  end
end
