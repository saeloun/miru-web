# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Offer email journeys", type: :system, js: true do
  include_context "issued offer records"
  include_context "hiring SMTP transport"
  let(:company) { create(:company, name: "Synthetic Offer Email QA") }
  let(:candidate_name) { "Synthetic Offer Email Candidate" }

  before do
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    sign_in admin
    allow(Rails.application.config.action_mailer).to receive(:default_url_options).and_return({ host: Capybara.server_host, port: Capybara.server_port, protocol: "http" })
  end

  around do |example|
    original = Api::V1::Hiring::BaseController.allow_forgery_protection
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = original
  end
  after { expect(@console_errors).to eq([]) }

  def open_messages(record, width: 1440)
    page.current_window.resize_to(width, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "Review offers"
    expect(page).to have_css("h5", text: /Offer ##{record.id}/)
    click_button "Candidate messages for offer #{record.id}"
  end

  def preview_message
    click_button "Choose enabled inbox"
    find("[cmdk-item]", text: "Hiring · #{mailbox.source_email}").click
    click_button "Preview candidate message"
    expect(page).to have_button("Confirm and queue message")
  end

  def capture(name)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_OFFER_MAIL_SHOTS"]

    folder = Rails.root.join(ENV.fetch("HIRING_OFFER_MAIL_SHOTS"))
    FileUtils.mkdir_p(folder)
    page.save_screenshot(folder.join("#{name}.png"), full: true)
  end

  it "delivers approved offer wording through local SMTP and opens the exact emailed private link" do
    record = issued_offer_record
    approve_offer_messages
    open_messages(record)
    preview_message
    within("section[aria-label='Candidate messages for offer #{record.id}']") do
      expect(page).to have_text("Please review your private offer")
      expect(page).not_to have_text("125000.50")
      expect(page).not_to have_text("PRIVATE")
    end
    capture("offer-email-preview-desktop")
    click_button "Confirm and queue message"
    expect(page).to have_text("Attempt 1")
    emailed_link = nil
    with_smtp_response do |commands, messages|
      HiringDeliveryJob.perform_now(HiringMessage.sole.id)
      expect(commands.count("DATA")).to eq(1)
      mail = Mail.read_from_string(messages.sole)
      expect(mail.to).to eq(["candidate@example.test"])
      expect(mail.body.decoded).not_to include("125000.50", "PRIVATE")
      emailed_link = mail.body.decoded.lines.last.split.last
      expect(URI.parse(emailed_link).fragment).to eq(record.access_token)
    end
    click_button "Refresh message history"
    expect(page).to have_text("Accepted by mail server")
    capture("offer-email-smtp-accepted-desktop")
    page.current_window.resize_to(375, 900)
    visit emailed_link
    expect(page).to have_text("125000.50 INR / monthly")
    expect(page).not_to have_text("PRIVATE")
    check "I have reviewed these offer terms"
    click_button "Accept offer"
    expect(page).to have_text("Your acceptance is recorded")
    capture("offer-email-candidate-accepted-mobile")
    open_messages(record, width: 375)
    expect(page).to have_text("Accepted by mail server")
    expect(page).to have_text("This offer is no longer awaiting a response")
    expect(page).to have_button("Preview candidate message", disabled: true)
    capture("offer-email-answered-history-mobile")
  end

  it "saves and approves editable offer wording in settings before previewing it on mobile" do
    record = issued_offer_record
    approve
    visit "/hiring"
    click_link "Communication settings"
    fill_in "Offer subject", with: "Your company offer"
    fill_in "Offer body", with: "Review the approved offer in your private portal."
    click_button "Save draft"
    expect(page).to have_text("Draft saved")
    expect(company.hiring_setting.reload).not_to be_approved
    click_button "Approve communications"
    expect(page).to have_text("Approved for new applications")
    open_messages(record, width: 375)
    preview_message
    within("section[aria-label='Candidate messages for offer #{record.id}']") do
      expect(page).to have_text("Your company offer")
      expect(page).to have_text("Review the approved offer in your private portal.")
    end
    expect(HiringMessage.count).to eq(0)
    capture("offer-email-approved-wording-mobile")
  end

  it "preserves stale wording after a conflict until Admin explicitly requests a new preview" do
    record = issued_offer_record
    setting = approve_offer_messages
    open_messages(record, width: 375)
    preview_message
    configure = Hiring::Configure.new(company:, actor: admin)
    setting = configure.save_draft!(details: setting.details.merge("offer_body" => "Newly approved private offer wording"), lock_version: setting.lock_version)
    configure.approve!(lock_version: setting.lock_version)
    click_button "Confirm and queue message"
    expect(page).to have_css('[role="alert"]', text: "changed")
    expect(page).to have_text("Please review your private offer and respond.")
    expect(HiringMessage.count).to eq(0)
    capture("offer-email-stale-preview-mobile")
    click_button "Discard preview"
    click_button "Preview candidate message"
    expect(page).to have_text("Newly approved private offer wording")
  end

  it "allows unknown-delivery evidence review after acceptance while preventing a new email or retry" do
    record = issued_offer_record
    approve_offer_messages
    communication = Hiring::OfferCommunication.new(offer: record, actor: admin)
    intent = communication.preview!(kind: "offer", mailbox_id: mailbox.id).fetch("intent")
    message, = communication.queue!(attributes: intent)
    message.update!(state: "uncertain", error_code: "transport_unknown", started_at: Time.current)
    record.with_lock { record.reply!("offer_version" => record.lock_version, "outcome" => "accepted") }
    open_messages(record, width: 375)
    expect(page).to have_button("Preview candidate message", disabled: true)
    click_button "Review unknown attempt 1"
    select "Not accepted", from: "Verified delivery outcome"
    fill_in "Delivery evidence", with: "Synthetic capture confirms non-acceptance; original worker stopped."
    check "Original worker has stopped and cannot resume"
    click_button "Record delivery evidence"
    expect(page).to have_text("Delivery evidence recorded. No new message was sent.")
    expect(page).not_to have_button("Preview retry for attempt 1", disabled: false)
    expect(HiringMessage.count).to eq(1)
    expect(message.reload.resolution).to eq("not_accepted")
    capture("offer-email-reviewed-after-response-mobile")
  end

  it "clears candidate identity, compensation and private siblings after an offer-mail denial" do
    record = issued_offer_record
    approve_offer_messages
    open_messages(record)
    preview_message
    allow_any_instance_of(Api::V1::Hiring::OfferMessagesController).to receive(:index).and_raise(Pundit::NotAuthorizedError)
    click_button "Refresh message history"
    expect(page).to have_css('[role="alert"]', text: /authorized|Forbidden/i)
    expect(page).not_to have_text(candidate_name)
    expect(page).not_to have_text("PRIVATE ADMIN NOTE")
    expect(page).not_to have_text("125000.50")
    capture("offer-email-permission-denied-desktop")
  end
end
