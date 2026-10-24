# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Signature delivery controls", type: :system, js: true do
  include SignatureRequestFixtures

  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:origin) { "https://signing.example.test" }
  let(:key) { "api_synthetic_delivery_key" }

  before do
    admin.add_role(:owner, company)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return(origin)
    @record = approved_signature_request(company:, actor: admin)
  end

  around do |example|
    controller = Api::V1::SignatureRequestsController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    controller.allow_forgery_protection = original if controller
  end

  def open_delivery
    sign_in(admin)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    visit "/agreements/documents/#{@record.id}"
    expect(page).to have_css('[data-pdf-ready="true"]')
    expect(page).to have_content("Signing delivery")
  end

  def connection
    SignatureConnection.create!(company:, created_by: admin, provider_origin: origin, api_key: key)
  end

  def queue_send
    connection
    Signatures::Operations.new(@record, actor: admin, attributes: signature_context(@record)).send_request
  end

  it "connects and rotates the company key without showing it in the document or changing old credentials" do
    provider = stub_request(:get, "#{origin}/api/v2/envelope?perPage=1")
      .to_return(body: { data: [], count: 0, currentPage: 1, perPage: 1, totalPages: 0 }.to_json,
        headers: { "Content-Type" => "application/json" })
    open_delivery
    expect(page).to have_button("Send for signature", disabled: true)
    expect(find_field("Signing API key")[:type]).to eq("password")
    fill_in "Signing API key", with: key
    click_button "Connect signing"
    expect(page).to have_content("Company signing connected")
    previous = SignatureConnection.active.find_by!(company:)
    expect(previous.api_key).to eq(key)
    click_button "Change signing connection"
    fill_in "Signing API key", with: "api_synthetic_replacement_key"
    click_button "Replace signing connection"
    expect(page).to have_content("Company signing connected")
    expect(previous.reload.api_key).to eq(key)
    expect(previous.disabled_at).to be_present
    expect(SignatureConnection.active.find_by!(company:).api_key).to eq("api_synthetic_replacement_key")
    expect(page).not_to have_field("Signing API key")
    expect(page.text).not_to include(key, "api_synthetic_replacement_key")
    expect(provider).to have_been_requested.twice
    expect(@console_errors).to be_empty
  end

  it "confirms the approved snapshot before queuing once and retains the edit lock during cancellation" do
    connection
    open_delivery
    fill_in "Reply to this review", with: "Unsent private follow-up"
    expect(page).to have_button("Send for signature", disabled: true)
    expect(SignatureOperation.count).to eq(0)
    fill_in "Reply to this review", with: ""
    click_button "Send for signature"
    within('[role="dialog"]') do
      expect(page).to have_content("Synthetic approved contract")
      expect(page).to have_content("signer@example.test")
      expect(page).to have_content("three automatic reminders")
      expect(SignatureOperation.count).to eq(0)
      click_button "Send signature emails"
    end
    expect(page).to have_content("Send queued")
    expect(@record.reload.current_revision.status).to eq("sending")
    expect(SignatureOperation.where(kind: "send").count).to eq(1)
    expect(page).to have_field("Document title", disabled: true)
    expect(page).not_to have_button("Send for signature")
    click_button "Cancel signature request"
    within('[role="dialog"]') { click_button "Request cancellation" }
    expect(page).to have_content("Cancellation requested")
    expect(@record.reload.current_revision.cancel_requested_at).to be_present
    expect(page).to have_field("Document title", disabled: true)
    expect(page).to have_content("Sending remains locked until cancellation is confirmed")
    expect(@console_errors).to be_empty
  end

  it "shows recipient status and enforces the reminder cooldown" do
    operation = queue_send
    operation.update!(state: "confirmed", phase: "distributing", finished_at: Time.current)
    revision = @record.current_revision
    revision.update!(status: "awaiting_signatures", provider_envelope_id: "envelope_synthetic", provider_status: "PENDING",
      provider_checked_at: Time.current, recipient_statuses: [{ "recipient_id" => "signer", "provider_recipient_id" => 42,
        "signing_status" => "NOT_SIGNED", "send_status" => "SENT", "read_status" => "OPENED" }])
    open_delivery
    expect(page).to have_content("Opened")
    click_button "Remind pending recipients"
    expect(page).to have_content("Reminder queued")
    expect(page).to have_button("Remind pending recipients", disabled: true)
    expect(page).to have_content("24 hours")
    expect(SignatureOperation.where(kind: "remind").count).to eq(1)
    click_button "Check signing status"
    expect(page).to have_content("Status check queued")
    expect(SignatureOperation.where(kind: "refresh").count).to eq(1)
    [375, 1440].each do |width|
      page.current_window.resize_to(width, 900)
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    end
    expect(@console_errors).to be_empty
  end

  it "reconciles an uncertain creation only by its exact provider ID without offering a resend" do
    operation = queue_send
    operation.update!(state: "uncertain", phase: "creating", error_code: "provider_uncertain")
    @record.current_revision.update!(status: "send_uncertain")
    open_delivery
    expect(page).to have_content("Do not create another request")
    expect(page).not_to have_button("Send for signature")
    expect(page).to have_field("Document title", disabled: true)
    provider_id = "envelope_#{'a' * 150}"
    fill_in "Provider envelope ID", with: provider_id
    click_button "Reconcile provider request"
    expect(page).to have_content("Status check queued")
    expect(SignatureOperation.find_by!(kind: "refresh").provider_candidate).to eq(provider_id)
    expect(SignatureOperation.where(kind: "send").count).to eq(1)
    expect(@console_errors).to be_empty
  end

  it "reports queue failure without claiming delivery or suggesting that a provider request was created" do
    allow(SignatureDeliveryJob).to receive(:perform_later).and_return(nil)
    connection
    open_delivery
    click_button "Send for signature"
    within('[role="dialog"]') { click_button "Send signature emails" }
    expect(page).to have_content("This action could not be queued")
    expect(page).not_to have_content("Send queued")
    expect(SignatureOperation.find_by!(kind: "send").state).to eq("failed")
    expect(page).not_to have_field("Provider envelope ID")
    expect(page).to have_button("Check signing status", disabled: false)
    expect(@console_errors).to be_empty
  end
end
