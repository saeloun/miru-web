# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin decision journeys", type: :system, js: true do
  include_context "interview message records"
  let(:company) { create(:company, name: "Synthetic Decisions QA") }
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

  def open_decisions(width: 1440)
    booking
    page.current_window.resize_to(width, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_current_path("/hiring/applications/#{application.id}")
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "Review decisions"
    expect(page).to have_text("New decision draft")
  end

  def save_draft(reason = "PRIVATE SAVED DECISION")
    fill_in "Internal decision reason", with: reason
    click_button "Save decision draft"
    expect(page).to have_text("Decision draft saved")
    expect(page).to have_css("h5", text: /Decision #\d+ · Draft/)
  end

  def capture(name)
    return unless ENV["HIRING_DECISION_SHOTS"]

    folder = Rails.root.join(ENV.fetch("HIRING_DECISION_SHOTS"))
    FileUtils.mkdir_p(folder)
    page.save_screenshot(folder.join("#{name}.png"), full: true)
  end

  it "saves a hold draft and requires a separate keyboard confirmation before finalizing it" do
    open_decisions
    select "Hold", from: "Decision outcome"
    click_button "Choose active hold owner"
    find("[cmdk-item]", text: interviewer.full_name).click
    fill_in "Hold follow-up date", with: "2026-11-10"
    expect(page).to have_text("Follow-up zone: #{company.resolved_time_zone.tzinfo.name}")
    save_draft("PRIVATE HOLD REASON")
    expect(application.reload.stage).to eq("interview")
    expect(booking.reload.status).to eq("scheduled")
    expect(page).to have_button("Finalize saved decision", disabled: true)
    capture("decision-hold-draft-desktop")
    find_field("I confirm this final decision").native.node.focus
    page.driver.browser.keyboard.type(:space)
    expect(page).to have_checked_field("I confirm this final decision")
    click_button "Finalize saved decision"
    expect(page).to have_text("Decision finalized. No email was sent.")
    expect(application.reload.stage).to eq("on_hold")
    expect(booking.reload.status).to eq("cancelled")
    expect(HiringMessage.count).to eq(0)
    expect(page).to have_text("Finalized · Hold")
    capture("decision-hold-finalized-desktop")
  end

  it "keeps a rejection draft separate from a final rejection and never sends mail on mobile" do
    open_decisions(width: 375)
    select "Reject", from: "Decision outcome"
    save_draft("")
    check "I confirm this final decision"
    click_button "Finalize saved decision"
    expect(page).to have_css('[role="alert"]', text: "Record an internal reason")
    expect(company.hiring_decisions.sole.state).to eq("draft")
    fill_in "Internal decision reason", with: "PRIVATE REJECTION REASON"
    expect(page).to have_button("Finalize saved decision", disabled: true)
    click_button "Save decision draft"
    expect(page).to have_text("Decision draft saved")
    check "I confirm this final decision"
    click_button "Finalize saved decision"
    expect(page).to have_text("This application is closed. Its decision history is read-only.")
    expect(application.reload.stage).to eq("rejected")
    expect(HiringMessage.count).to eq(0)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    capture("decision-rejected-mobile")
  end

  it "preserves stale wording until an explicit discard and reload" do
    open_decisions
    save_draft
    application.reload.touch
    fill_in "Internal decision reason", with: "UNSAVED PRIVATE INTENT"
    click_button "Save decision draft"
    expect(page).to have_css('[role="alert"]', text: "changed")
    expect(find_field("Internal decision reason").value).to eq("UNSAVED PRIVATE INTENT")
    expect(company.hiring_decisions.sole.details.fetch("reason")).to eq("PRIVATE SAVED DECISION")
    capture("decision-stale-draft-desktop")
    click_button "Discard edits and reload decisions"
    expect(page).to have_field("Internal decision reason", with: "PRIVATE SAVED DECISION")
    expect(page).to have_unchecked_field("I confirm this final decision")
  end

  it "recovers a lost accepted creation response with the unchanged request on mobile" do
    lost = false
    allow_any_instance_of(Api::V1::Hiring::DecisionsController).to receive(:create).and_wrap_original do |original, *arguments|
      original.call(*arguments)
      unless lost
        lost = true
        controller = original.receiver
        controller.response.status = 503
        controller.response_body = { errors: "Synthetic lost accepted decision response" }.to_json
      end
    end
    open_decisions(width: 375)
    fill_in "Internal decision reason", with: "PRIVATE RECOVERED DRAFT"
    click_button "Save decision draft"
    expect(page).to have_button("Retry unchanged decision request")
    expect(page).to have_field("Internal decision reason", disabled: true)
    expect(company.hiring_decisions.count).to eq(1)
    click_button "Retry unchanged decision request"
    expect(page).to have_text("Decision draft saved")
    expect(page).to have_field("Internal decision reason", with: "PRIVATE RECOVERED DRAFT", disabled: false)
    expect(company.hiring_decisions.count).to eq(1)
    capture("decision-recovered-mobile")
  end

  it "clears the whole candidate and private sibling data after a scoped denial" do
    open_decisions
    save_draft
    allow_any_instance_of(Api::V1::Hiring::DecisionsController).to receive(:index).and_raise(Pundit::NotAuthorizedError)
    click_button "Discard edits and reload decisions"
    expect(page).to have_css('[role="alert"]', text: /authorized|Forbidden/i)
    expect(page).to have_no_text("Synthetic Decision Candidate")
    expect(page).to have_no_text("PRIVATE ADMIN NOTE")
    expect(page).to have_no_text("PRIVATE SAVED DECISION")
    capture("decision-permission-denied-desktop")
  end
end
