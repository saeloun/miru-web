# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring intake", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Hiring QA") }
  let(:admin) { create(:user, first_name: "Synthetic", last_name: "Hiring Admin", current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }

  before { admin.add_role(:admin, company) }

  around do |example|
    controller = Api::V1::Hiring::BaseController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    controller.allow_forgery_protection = original if controller
  end

  def open_hiring(width: 1440)
    sign_in admin
    page.current_window.resize_to(width, 900)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    visit "/hiring"
  end

  def add_candidate(name: "Synthetic Hiring Candidate", email: "hiring-candidate@example.test", notes: "")
    within('nav[aria-label="Hiring navigation"]') { click_link "Add application" }
    fill_in "Full name", with: name
    fill_in "Email", with: email
    fill_in "Internal notes", with: notes
  end

  def capture(name)
    return unless ENV["MIRU_QA_SCREENSHOTS"] == "1"

    path = Rails.root.join("docs/qa/hiring-2463", name)
    FileUtils.mkdir_p(path.dirname)
    page.save_screenshot(path, full: true)
  end

  it "adds a role, assigns an owner and keeps repeated applications on one candidate profile" do
    open_hiring
    expect(page).to have_css("h1", text: "Hiring")
    expect(page).to have_text("No applications yet")
    click_link "Manage roles"
    fill_in "Role title", with: "Senior Ruby consultant"
    click_button "Add role"
    expect(page).to have_text("Senior Ruby consultant")
    capture("roles-desktop.png")

    add_candidate(notes: "Synthetic private screening note")
    find("#application-role").click
    find("[cmdk-item]", text: "Senior Ruby consultant").click
    find("#application-owner").click
    find("[cmdk-item]", text: admin.full_name).click
    capture("manual-intake-form-desktop.png")
    click_button "Add application"
    expect(page).to have_css("h2", text: "Synthetic Hiring Candidate")
    expect(page).to have_text("Synthetic private screening note")
    expect(page).to have_text("Senior Ruby consultant")
    expect(page).to have_text(admin.full_name)

    add_candidate(name: "Synthetic Updated Submission")
    click_button "Add application"
    expect(page).to have_css("h2", text: "Synthetic Hiring Candidate")
    expect(page).to have_text("Synthetic Updated Submission")
    expect(page).to have_text("2 applications")
    expect(HiringCandidate.where(company:).count).to eq(1)
    expect(HiringApplication.where(company:).count).to eq(2)
    expect(@console_errors).to eq([])
    capture("manual-intake-desktop.png")
  end

  it "supports mobile intake and useful validation recovery without page overflow" do
    open_hiring(width: 375)
    add_candidate(name: "Synthetic Mobile Candidate", email: "mobile-candidate@example.test")
    capture("manual-intake-form-mobile.png")
    click_button "Add application"
    expect(page).to have_css("h2", text: "Synthetic Mobile Candidate")
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to eq(true)
    expect(@console_errors).to eq([])
    capture("manual-intake-mobile.png")

    click_link "All applications"
    fill_in "From date", with: "2026-09-16"
    fill_in "To date", with: "2026-09-15"
    expect(page).to have_css('[role="alert"]', text: "Invalid hiring parameters")
    capture("filter-recovery-mobile.png")
    click_button "Clear filters"
    expect(page).to have_link("Synthetic Mobile Candidate")
    capture("pipeline-mobile.png")
    expect(@console_errors).to eq([])
  end

  it "keeps hiring navigation and candidate data unavailable to employees" do
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id,
      "request_key" => SecureRandom.uuid, "full_name" => "Synthetic Restricted Candidate", "email" => "restricted@example.test" }).process
    admin.remove_role(:admin, company)
    admin.add_role(:employee, company)
    open_hiring
    expect(page).not_to have_link("Add application")
    expect(page).not_to have_text("Synthetic Restricted Candidate")
    expect(@console_errors).to eq([])
  end

  it "keeps applications searchable after their role is closed" do
    role = HiringRole.create!(company:, title: "Synthetic closed role")
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id,
      "request_key" => SecureRandom.uuid, "full_name" => "Synthetic Historic Candidate", "email" => "history@example.test",
      "role_id" => role.id }).process
    open_hiring
    click_link "Manage roles"
    select "Closed", from: "role-status-#{role.id}"
    click_button "Save role"
    expect(page).to have_text("Role saved.")
    click_link "All applications"
    find("#filter-role").click
    find("[cmdk-item]", text: "Synthetic closed role").click
    expect(page).to have_link("Synthetic Historic Candidate")
    expect(page).to have_css("tbody tr", count: 1)
    expect(@console_errors).to eq([])
  end

  it "preserves another role's unsaved edit when saving one role" do
    first = HiringRole.create!(company:, title: "Synthetic Alpha role")
    second = HiringRole.create!(company:, title: "Synthetic Beta role")
    open_hiring
    click_link "Manage roles"
    fill_in "role-title-#{first.id}", with: "Saved Alpha title"
    fill_in "role-title-#{second.id}", with: "Unsaved Beta title"
    find_field("role-title-#{first.id}").find(:xpath, "ancestor::form").click_button "Save role"
    expect(page).to have_text("Role saved.")
    expect(page).to have_field("role-title-#{second.id}", with: "Unsaved Beta title")
    fill_in "Role title", with: "Synthetic Gamma role", exact: true
    click_button "Add role"
    expect(page).to have_text("Role added: Synthetic Gamma role")
    expect(page).to have_field("role-title-#{second.id}", with: "Unsaved Beta title")
    capture("preserved-role-drafts-desktop.png")
    expect(@console_errors).to eq([])
  end

  it "reopens a paginated picker without repeating options or emitting duplicate-key errors" do
    21.times { |index| HiringRole.create!(company:, title: "Synthetic Role #{index.to_s.rjust(2, '0')}") }
    open_hiring
    add_candidate
    find("#application-role").click
    expect(page).to have_css("[cmdk-item]", count: 20)
    click_button "Load more"
    expect(page).to have_css("[cmdk-item]", count: 21)
    find("[cmdk-item]", text: "Synthetic Role 20").click
    find("#application-role").click
    expect(page).to have_css("[cmdk-item]", count: 20)
    click_button "Load more"
    expect(page).to have_css("[cmdk-item]", count: 21)
    expect(page.all("[cmdk-item]").map(&:text).uniq.length).to eq(21)
    page.driver.browser.keyboard.type(:escape)
    expect(page).to have_css("#application-role:focus[aria-expanded='false']")
    find("#application-role").send_keys(:down)
    expect(page).to have_css("#application-role[aria-expanded='true']")
    expect(page).to have_css("[cmdk-item]", count: 20)
    expect(@console_errors).to eq([])
  end

  it "finishes a role save after filtering its row away and permits the next edit" do
    role = HiringRole.create!(company:, title: "Synthetic Alpha role")
    HiringRole.create!(company:, title: "Synthetic Beta role")
    started, release = Queue.new, Queue.new
    first_request = true
    allow_any_instance_of(Api::V1::Hiring::RolesController).to receive(:update).and_wrap_original do |action, *args|
      if first_request
        first_request = false
        started << true
        release.pop
      end
      action.call(*args)
    end
    open_hiring
    click_link "Manage roles"
    fill_in "role-title-#{role.id}", with: "Saved through filtering"
    find_field("role-title-#{role.id}").find(:xpath, "ancestor::form").click_button "Save role"
    expect(started.pop(timeout: Capybara.default_max_wait_time)).to eq(true)
    fill_in "Find roles", with: "Beta"
    expect(page).not_to have_field("role-title-#{role.id}")
    expect(page).to have_field("Find roles", with: "Beta")
    release << true
    expect(page).to have_text("Role saved.")
    fill_in "Find roles", with: ""
    expect(page).to have_field("role-title-#{role.id}", with: "Saved through filtering")
    fill_in "role-title-#{role.id}", with: "Saved again after filtering"
    find_field("role-title-#{role.id}").find(:xpath, "ancestor::form").click_button "Save role"
    expect(page).to have_text("Role saved.")
    expect(page).to have_field("role-title-#{role.id}", with: "Saved again after filtering", disabled: false)
    expect(role.reload.title).to eq("Saved again after filtering")
    expect(@console_errors).to eq([])
    capture("asynchronous-role-save-desktop.png")
  ensure
    release << true if release
  end

  it "recovers the saved application after a lost response and an edited retry without creating a duplicate" do
    first_request = true
    allow_any_instance_of(Api::V1::Hiring::ApplicationsController).to receive(:create).and_wrap_original do |action, *args|
      action.call(*args)
      if first_request
        first_request = false
        action.receiver.response.status = 500
      end
    end
    open_hiring
    add_candidate(name: "Synthetic Saved Candidate", email: "saved-candidate@example.test")
    click_button "Add application"
    expect(page).to have_css('[role="alert"]', text: /retry/i)
    fill_in "Full name", with: "Edited after lost response"
    click_button "Add application"
    expect(page).to have_link("Open saved application")
    expect(page).to have_button("Add application", disabled: true)
    capture("application-recovery-action-desktop.png")
    click_link "Open saved application"
    expect(page).to have_css("h2", text: "Synthetic Saved Candidate")
    expect(company.hiring_applications.count).to eq(1)
    expect(@console_errors).to eq([])
    capture("recovered-application-desktop.png")
  end
end
