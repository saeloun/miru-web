# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin candidate form review", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Hiring Review QA") }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => "Synthetic Candidate", "email" => "verified-candidate@example.test" }).process
  end

  before do
    admin.add_role(:admin, company)
    form = Hiring::Form.default_schema.merge("enabled" => true)
    form.fetch("fields") << { "id" => "custom_private", "label" => "Private explanation", "type" => "textarea",
                             "required" => false, "sensitive" => true }
    details = HiringSetting::TEXT_FIELDS.index_with { |field| "Synthetic approved #{field}" }.merge("client_count" => 0)
    configuration = Hiring::Configure.new(company:, actor: admin)
    saved = configuration.save_draft!(details:, form:, lock_version: nil)
    configuration.approve!(lock_version: saved.lock_version)
  end

  around do |example|
    controllers = [Api::V1::Hiring::BaseController, HiringPortalController]
    originals = controllers.index_with(&:allow_forgery_protection)
    controllers.each { |controller| controller.allow_forgery_protection = true }
    with_forgery_protection { example.run }
  ensure
    originals&.each { |controller, value| controller.allow_forgery_protection = value }
  end

  def open_application(width: 1440)
    sign_in admin
    page.current_window.resize_to(width, 900)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_css("h3", text: "Candidate forms")
  end

  def form_panel
    find('section[aria-label="Candidate forms"]')
  end

  it "opens communication settings to enable an unapproved form" do
    configuration = Hiring::Configure.new(company:, actor: admin)
    setting = company.hiring_setting
    configuration.save_draft!(details: setting.details,
      form: setting.form_schema.merge("enabled" => false), lock_version: setting.lock_version)
    open_application
    within(form_panel) { click_link "Enable and approve the candidate form" }
    expect(page).to have_css("h2", text: "Hiring communications")
    expect(@console_errors).to eq([])
  end

  it "issues a private link, reviews submitted answers and downloads the exact resume before revoking the link" do
    open_application
    within(form_panel) { click_button "Create private form link" }
    expect(page).to have_field("Private form link", readonly: true)
    url = find_field("Private form link").value
    access = application.hiring_portal_accesses.sole
    expect(URI(url).query).to be_nil
    expect(URI(url).fragment).to eq(access.access_token)
    expect(ActionMailer::Base.deliveries).to be_empty
    visit "#{URI(url).path}##{URI(url).fragment}"
    expect(page).to have_css("h1", text: "Application form")
    fill_in "Full name", with: "Submitted Candidate"
    fill_in "Email", with: "submitted-candidate@example.test"
    fill_in "Expected compensation amount", with: "120000.50"
    fill_in "Expected compensation currency", with: "INR"
    select_radix "Expected compensation period", "Monthly"
    fill_in "Private explanation", with: "Private candidate context"
    source = Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    attach_file "Resume", source
    expect(page).to have_text("Uploaded: qa-main.pdf")
    click_button "Submit application"
    expect(page).to have_text("Application submitted")
    visit "/hiring/applications/#{application.id}"
    within(form_panel) do
      expect(page).to have_text("Submitted")
      find("summary", text: "View submitted answers").click
      expect(page).to have_text("120000.50 INR")
      expect(page).to have_text("Private candidate context")
      expect(page).to have_text("Not provided")
      Dir.mktmpdir("miru-candidate-download") do |directory|
        downloads = page.driver.browser.downloads
        downloads.set_behavior(save_path: directory)
        expect(downloads.wait(10) { click_button "Download resume", exact: true }).to be(true)
        expect(File.binread(File.join(directory, "qa-main.pdf"))).to eq(File.binread(source))
      end
      click_button "Revoke link"
    end
    within('[role="dialog"]') { click_button "Revoke link", exact: true }
    within(form_panel) { expect(page).to have_text("Revoked") }
    expect(access.reload.revoked_at).to be_present
    expect(application.hiring_candidate.reload.email).to eq("verified-candidate@example.test")
    expect(@console_errors).to eq([])
  end

  it "confirms replacing an active link and recovers stale edits without creating another link" do
    open_application(width: 375)
    within(form_panel) { click_button "Create private form link" }
    first = application.hiring_portal_accesses.sole
    expect(page).to have_field("Private form link", readonly: true)
    within(form_panel) { click_button "Replace active link" }
    within('[role="dialog"]') { click_button "Cancel" }
    expect(first.reload.revoked_at).to be_nil
    expect(application.hiring_portal_accesses.count).to eq(1)
    application.reload.update!(notes: "A separate reviewer changed this application.")
    within(form_panel) { click_button "Replace active link" }
    within('[role="dialog"]') { click_button "Replace link", exact: true }
    within(form_panel) do
      expect(page).to have_css('[role="alert"]', text: "application changed")
      expect(application.hiring_portal_accesses.count).to eq(1)
      click_button "Refresh forms"
      expect(page).not_to have_css('[role="alert"]')
      click_button "Replace active link"
    end
    within('[role="dialog"]') { click_button "Replace link", exact: true }
    expect(page).to have_text("Private link created")
    expect(application.hiring_portal_accesses.count).to eq(2)
    expect(first.reload.revoked_at).to be_present
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to eq(true)
    expect(@console_errors).to eq([])
  end
end
