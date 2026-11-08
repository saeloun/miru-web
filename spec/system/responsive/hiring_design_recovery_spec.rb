# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring deadline clarity and workspace recovery", type: :system, js: true do
  include_context "assignment message records"
  let(:company) { create(:company, name: "Synthetic Hiring Design QA") }
  let(:candidate_name) { "Synthetic Design Candidate" }

  before do
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    sign_in admin
    page.current_window.resize_to(375, 900)
  end

  after { expect(@console_errors).to eq([]) }

  def capture(name)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_DESIGN_SHOTS"]

    directory = Rails.root.join(ENV.fetch("HIRING_DESIGN_SHOTS"))
    FileUtils.mkdir_p(directory)
    page.save_screenshot(directory.join("#{name}.png"), full: true)
  end

  def open_application
    application
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    expect(page).to have_text(candidate_name)
  end

  def assert_workspace_denied(message)
    expect(page).to have_css('[role="alert"]', text: message)
    expect(page).to have_no_css('nav[aria-label="Hiring navigation"]')
    expect(page).to have_no_link("Manage roles")
    expect(page).to have_no_link("Add application")
    expect(page).to have_no_button("Retry", exact: true)
    expect(page).to have_link("Back to dashboard")
    expect(page).to have_no_text(candidate_name)
    expect(page).to have_no_text("PRIVATE ADMIN NOTE")
  end

  it "labels both candidate cutoffs with the browser IANA zone without changing their absolute instants" do
    record = assignment
    visit "/hiring-assignment##{record.access_token}"
    expect(page).to have_css("h1", text: "Catalogue assessment")
    zone = page.evaluate_script("Intl.DateTimeFormat().resolvedOptions().timeZone")
    deadline = find("time[datetime]")
    expect(deadline.text).to include(zone)
    expect(Time.iso8601(deadline["datetime"])).to eq(record.due_at)
    capture("candidate-assignment-zoned-mobile")
    setting = approve
    configuration = Hiring::Configure.new(company:, actor: admin)
    setting = configuration.save_draft!(details: setting.details, form: Hiring::Form.default_schema.merge("enabled" => true), lock_version: setting.lock_version)
    setting = configuration.approve!(lock_version: setting.lock_version)
    access = Hiring::Form.issue!(application:, setting:, actor: admin)
    visit "/hiring-form##{access.access_token}"
    expect(page).to have_css("h1", text: "Application form")
    expiry = find("time[datetime]")
    expect(expiry.text).to include(zone)
    expect(Time.iso8601(expiry["datetime"])).to eq(access.expires_at)
    capture("candidate-form-zoned-expiry-mobile")
  end

  it "clears the whole workspace and its Retry action after an authoritative child403" do
    open_application
    admin.remove_role(:admin, company)
    click_button "Reload screening"
    assert_workspace_denied(/authorized|Forbidden/i)
    capture("workspace-access-denied-mobile")
  end

  it "handles an initial403 while the client still has an Admin role" do
    application
    allow_any_instance_of(Api::V1::Hiring::ApplicationsController).to receive(:show).and_raise(Pundit::NotAuthorizedError)
    visit "/hiring/applications/#{application.id}"
    assert_workspace_denied(/authorized|Forbidden/i)
    capture("workspace-initial-access-denied-mobile")
  end

  it "clears the shell after a successful child response belongs to a different workspace" do
    open_application
    allow_any_instance_of(Api::V1::Hiring::ScreeningsController).to receive(:index) do |controller|
      controller.render(json: { company_id: company.id + 1, screenings: [], pagination: { page: 1, per_page: 20, has_more: false } })
    end
    click_button "Reload screening"
    assert_workspace_denied("The hiring workspace changed")
    capture("workspace-response-mismatch-mobile")
  end

  it "clears the shell after an explicit server workspace conflict" do
    open_application
    allow_any_instance_of(Api::V1::Hiring::ScreeningsController).to receive(:index).and_raise(Hiring::Intake::WorkspaceChanged, "The hiring workspace changed. Reload the current workspace.")
    click_button "Reload screening"
    assert_workspace_denied("The hiring workspace changed")
  end

  it "retains ordinary navigation and Retry for a transient503 and recovers the private page" do
    fail_once = true
    allow_any_instance_of(Api::V1::Hiring::ApplicationsController).to receive(:show).and_wrap_original do |original, *arguments|
      if fail_once
        fail_once = false
        original.receiver.render(json: { errors: "Synthetic temporary loading failure" }, status: 503)
      else
        original.call(*arguments)
      end
    end
    application
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_css('[role="alert"]', text: "Synthetic temporary loading failure")
    expect(page).to have_css('nav[aria-label="Hiring navigation"]')
    expect(page).to have_button("Retry", exact: true)
    capture("workspace-transient-retry-mobile")
    click_button "Retry", exact: true
    expect(page).to have_text(candidate_name)
    expect(page).to have_text("PRIVATE ADMIN NOTE")
  end

  it "keeps management navigation for an ordinary missing-record404" do
    visit "/hiring/applications/999999999"
    expect(page).to have_css('[role="alert"]', text: "Hiring record unavailable")
    expect(page).to have_css('nav[aria-label="Hiring navigation"]')
    expect(page).to have_link("Manage roles")
    expect(page).to have_button("Retry", exact: true)
    capture("workspace-missing-record-mobile")
  end
end
