# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring assignment library", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Assignment QA") }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }

  before { admin.add_role(:admin, company) }

  around do |example|
    original = Api::V1::Hiring::BaseController.allow_forgery_protection
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = original
  end

  def open_library(width: 1440)
    sign_in admin
    page.current_window.resize_to(width, 900)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    visit "/hiring"
    click_link "Assignment library"
    expect(page).to have_css("h2", text: "Assignment library", exact_text: true)
  end

  def add_task
    fill_in "New task title", with: "Synthetic Rails catalogue"
    click_button "Create task draft"
    expect(page).to have_css("h2", text: "Synthetic Rails catalogue", exact_text: true)
  end

  it "creates and explicitly approves a task, then preserves the approved version when editing on mobile" do
    open_library(width: 375)
    add_task
    fill_in "Skills", with: "Rails, PostgreSQL"
    fill_in "Experience", with: "Mid-level"
    fill_in "Instructions", with: "Build a small catalogue with a search endpoint."
    fill_in "Assessment criteria", with: "Show tests and explain a failure case."
    fill_in "Expected effort (minutes)", with: "90"
    select "Repository or files", from: "Submission method"
    fill_in "AI-use policy", with: "Tools are allowed; explain your own work and disclose usage."
    click_button "Save draft"
    expect(page).to have_text("Draft saved. Approval is a separate action.")
    click_button "Approve saved version"
    expect(page).to have_text("Version approved for explicit issuance.")
    expect(page).to have_button("Approve saved version", disabled: true)
    fill_in "Expected effort (minutes)", with: "45"
    click_button "Save draft"
    expect(page).to have_text("Draft saved. Approval is a separate action.")
    within('section[aria-label="Task revision history"]') do
      find("summary", text: "Version 2 · approved").click
      expect(page).to have_text("90 minutes")
      expect(page).to have_text("Tools are allowed; explain your own work and disclose usage.")
    end
    expect(HiringApplication.count).to eq(0)
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(page.evaluate_script("document.documentElement.scrollWidth > window.innerWidth")).to be(false)
    expect(@console_errors).to eq([])
  end

  it "retains a stale draft and requires explicit discard before reloading the saved task" do
    open_library
    add_task
    record = company.hiring_assignment_templates.sole
    fill_in "Instructions", with: "My unsaved instructions"
    Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "lock_version" => record.lock_version, "skills" => "Concurrent PostgreSQL edit"
    }).process(template: record)
    click_button "Save draft"
    expect(page).to have_text("This task changed. Reload before saving or approving.")
    expect(page).to have_field("Instructions", with: "My unsaved instructions")
    click_button "Reload saved task"
    expect(page).to have_button("Discard draft and reload")
    click_button "Keep editing"
    expect(page).to have_field("Instructions", with: "My unsaved instructions")
    click_button "Reload saved task"
    click_button "Discard draft and reload"
    expect(page).to have_field("Skills", with: "Concurrent PostgreSQL edit")
    expect(page).to have_field("Instructions", with: "")
    expect(@console_errors).to eq([])
  end

  it "can retry a failed refresh without losing the editor" do
    fail_reads = false
    allow_any_instance_of(Api::V1::Hiring::AssignmentTemplatesController).to receive(:show).and_wrap_original do |original|
      fail_reads ? original.receiver.head(:service_unavailable) : original.call
    end
    open_library
    add_task
    fail_reads = true
    click_button "Reload saved task"
    expect(page).to have_css('[role="alert"]', text: "Unable to load or save this hiring record")
    fail_reads = false
    expect(page).to have_button("Reload saved task", disabled: false)
    click_button "Reload saved task"
    expect(page).to have_field("Task title", with: "Synthetic Rails catalogue", disabled: false)
    expect(page).not_to have_css('[role="alert"]')
  end
end
