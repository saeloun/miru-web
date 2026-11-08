# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Scoped hiring note handover", type: :system, js: true do
  include_context "interview message records"
  let(:company) { create(:company, name: "Synthetic Handover Notes QA") }
  let(:notes) { "Discuss the candidate's migration tradeoffs; this is explicitly shared with the panel." }

  around do |example|
    original = Api::V1::Hiring::BaseController.allow_forgery_protection
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = original
  end

  def capture(name)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_NOTE_SHOTS"]

    directory = Rails.root.join(ENV.fetch("HIRING_NOTE_SHOTS"))
    FileUtils.mkdir_p(directory)
    page.save_screenshot(directory.join("#{name}.png"), full: true)
  end

  it "lets Admin explicitly share panel notes without cancelling the meeting, then removes them after access revocation" do
    issued = booking
    errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| errors << event }
    sign_in admin
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "View interview rounds"
    click_button "Edit round 1"
    fill_in "Hiring notes for assigned interviewers", with: notes
    expect(page).to have_text("General Admin notes stay private")
    capture("notes-editor-desktop")
    click_button "Save interview round"
    expect(page).to have_text("Interview round saved")
    expect(page).to have_no_field("Hiring notes for assigned interviewers", disabled: :all)
    expect(round.reload.details.fetch("hiring_notes")).to eq(notes)
    expect(issued.reload.status).to eq("scheduled")

    sign_out admin
    sign_in interviewer
    page.current_window.resize_to(390, 900)
    visit "/interview-reviews/#{round.id}"
    expect(page).to have_css('section[aria-label="Scoped hiring notes"]', text: notes)
    expect(page).to have_no_text("PRIVATE ADMIN NOTE")
    capture("notes-assigned-reviewer-mobile")
    round.hiring_access_grants.active.update_all(revoked_at: Time.current)
    click_button "Refresh handover"
    expect(page).to have_css('[role="alert"]')
    expect(page).to have_no_text(notes)
    capture("notes-revoked-mobile")
    expect(errors).to be_empty
  end
end
