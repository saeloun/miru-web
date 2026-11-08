# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring pipeline overview", type: :system, js: true do
  include_context "interview message records"
  let(:company) { create(:company, name: "Synthetic Pipeline QA") }
  let(:candidate_name) { "Synthetic Pipeline Candidate" }

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

  def open_pipeline(width: 1440)
    page.current_window.resize_to(width, 900)
    visit "/hiring/pipeline"
    expect(page).to have_css("h2", text: "Hiring pipeline")
    expect(page).to have_css('section[aria-label="Pipeline metrics"]')
  end

  def capture(name)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_PIPELINE_SHOTS"]

    folder = Rails.root.join(ENV.fetch("HIRING_PIPELINE_SHOTS"))
    FileUtils.mkdir_p(folder)
    page.save_screenshot(folder.join("#{name}.png"), full: true)
  end

  it "shows actual cohort totals, continues pagination and privately filters actionable queues by a former interviewer" do
    booking
    21.times do |index|
      Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
        "full_name" => "Synthetic Pipeline Extra #{index}", "email" => "pipeline-#{index}@example.test" }).process
    end
    open_pipeline
    expect(page).to have_text("Filtered pipeline · 22 applications")
    expect(page).to have_button("Upcoming interviews · 1")
    expect(page).to have_text("Average time to hire: Not available")
    expect(page).to have_text("Received → Interview")
    expect(page).to have_text("1 / 22")
    expect(page).to have_no_link(candidate_name)
    click_button "Next", exact: true
    expect(page).to have_text("Page 2")
    expect(page).to have_link(candidate_name, href: "/hiring/applications/#{application.id}")
    expect(page).to have_text("Filtered pipeline · 22 applications")
    capture("pipeline-pagination-desktop")

    click_button "Upcoming interviews · 1"
    expect(page).to have_text("Page 1")
    within('section[aria-label="Pipeline applications"]') { expect(page).to have_css("li", count: 1) }
    staff.update!(resigned_at: Date.yesterday)
    find("#pipeline-interviewer").click
    find("[cmdk-item]", text: interviewer.full_name).click
    fill_in "Find candidates", with: "candidate@example.test"
    click_button "Apply filters"
    expect(page).to have_text("Filtered pipeline · 1 application")
    expect(page).to have_link(candidate_name)
    expect(page.current_url).not_to include("candidate@example.test")
    capture("pipeline-queue-desktop")
    click_link candidate_name
    expect(page).to have_current_path("/hiring/applications/#{application.id}")
    expect(page).to have_css("h2", text: candidate_name)
  end

  it "keeps empty metrics explicit and recovers from invalid experience bounds on mobile" do
    open_pipeline(width: 390)
    expect(page).to have_text("Filtered pipeline · 0 applications")
    expect(page).to have_text("Average time to hire: Not available")
    expect(page).to have_text("No matching applications.")
    expect(page).to have_text("No recorded stage transitions in this cohort.")
    expect(page).to have_text("No finalized rejection reasons in this cohort.")
    expect(page).to have_field("Received from", type: "date")
    expect(page).to have_field("Received through", type: "date")
    capture("pipeline-empty-mobile")
    fill_in "Minimum total experience (years)", with: "5"
    fill_in "Maximum total experience (years)", with: "2"
    click_button "Apply filters"
    expect(page).to have_css('[role="alert"]', text: "Use valid pipeline filters.")
    expect(page).to have_no_css('section[aria-label="Pipeline metrics"]')
    click_button "Clear filters"
    expect(page).to have_text("Filtered pipeline · 0 applications")
    expect(page).to have_field("Minimum total experience (years)", with: "")
    capture("pipeline-recovery-mobile")
  end

  it "clears candidate data, counts and filter values when Admin membership ends" do
    booking
    open_pipeline
    expect(page).to have_link(candidate_name)
    fill_in "Find candidates", with: "candidate@example.test"
    membership.update!(resigned_at: Date.yesterday)
    find("#pipeline-role").click
    expect(page).to have_css('[role="alert"]', text: /authorized|Forbidden/i)
    expect(page).to have_no_link(candidate_name)
    expect(page).to have_no_text("candidate@example.test")
    expect(page).to have_no_css('form[aria-label="Pipeline filters"]')
    expect(page).to have_no_css('section[aria-label="Pipeline metrics"]')
    capture("pipeline-permission-denied-desktop")
  end

  it "clears the full report when a request belongs to a workspace that is no longer current" do
    booking
    open_pipeline(width: 390)
    other = create(:company)
    create(:employment, company: other, user: admin, resigned_at: nil)
    admin.add_role(:admin, other)
    admin.update!(current_workspace: other)
    click_button "Apply filters"
    expect(page).to have_css('[role="alert"]', text: "The hiring workspace changed.")
    expect(page).to have_no_text(candidate_name)
    expect(page).to have_no_text("candidate@example.test")
    expect(page).to have_no_css('form[aria-label="Pipeline filters"]')
    expect(page).to have_no_css('section[aria-label="Hiring queues"]')
    capture("pipeline-workspace-denied-mobile")
  end
end
