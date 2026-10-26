# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin application screening", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Screening QA") }
  let(:admin) { create(:user, first_name: "Synthetic", last_name: "Hiring Admin", current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => "Synthetic Screening Candidate", "email" => "screening-candidate@example.test" }).process
  end

  before { admin.add_role(:admin, company) }

  around do |example|
    original = Api::V1::Hiring::BaseController.allow_forgery_protection
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = original
  end

  def open_screening(width: 1440)
    sign_in admin
    page.current_window.resize_to(width, 900)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_css("h2", text: "Synthetic Screening Candidate", exact_text: true)
    expect(page).to have_css("h3", text: "Screening", exact_text: true)
  end

  it "shortlists on mobile and retains the role, owner and private reason without mailing the candidate" do
    role = company.hiring_roles.create!(title: "Senior Rails consultant")
    open_screening(width: 375)
    within('section[aria-label="Screening"]') do
      find("#screening-role").click
    end
    find("[cmdk-item]", text: role.title).click
    within('section[aria-label="Screening"]') { find("#screening-owner").click }
    find("[cmdk-item]", text: admin.full_name).click
    within('section[aria-label="Screening"]') do
      select "Shortlist", from: "Screening action"
      fill_in "Screening reason", with: "Synthetic Rails contribution meets the role"
      click_button "Save screening"
      expect(page).to have_text("Screening saved")
      expect(page).to have_text("Synthetic Rails contribution meets the role")
      expect(page).to have_text("Senior Rails consultant")
    end
    expect(application.reload).to have_attributes(stage: "shortlisted", hiring_role_id: role.id, owner_employment_id: membership.id)
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to eq(true)
    expect(@console_errors).to eq([])
    if ENV["MIRU_QA_SCREENSHOTS"] == "1"
      page.save_screenshot(Rails.root.join("docs/qa/hiring-2463/screening-shortlisted-mobile.png"), full: true)
    end
  end

  it "preserves unsaved choices across a stale decision and requires a separate save after reload" do
    open_screening
    within('section[aria-label="Screening"]') do
      select "Record information request", from: "Screening action"
      fill_in "Screening reason", with: "Please clarify your availability"
      application.update!(stage: "screening")
      click_button "Save screening"
      expect(page).to have_css('[role="alert"]', text: "changed")
      expect(page).to have_field("Screening reason", with: "Please clarify your availability")
      expect(application.reload.stage).to eq("screening")
      click_button "Reload screening"
      expect(page).to have_text("Review your unsaved choices")
      expect(page).to have_field("Screening reason", with: "Please clarify your availability")
      expect(application.hiring_screenings).to be_empty
      click_button "Save screening"
      expect(page).to have_text("Screening saved")
    end
    expect(application.reload.stage).to eq("information_pending")
    expect(application.hiring_screenings.sole.details.fetch("reason")).to eq("Please clarify your availability")
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(@console_errors).to eq([])
  end

  it "keeps the newer screening stage when an older candidate-form response arrives last" do
    released = false
    held = false
    allow_any_instance_of(Api::V1::Hiring::FormsController).to receive(:index).and_wrap_original do |original|
      original.call
      held = true
      Async::Task.current.sleep(0.01) until released
    end
    open_screening
    expect(page).to have_css('section[aria-label="Candidate forms"]', text: "Loading form history") { held }
    within('section[aria-label="Screening"]') do
      select "Shortlist", from: "Screening action"
      fill_in "Screening reason", with: "Review completed before the old response"
      click_button "Save screening"
      expect(page).to have_text("Review completed before the old response")
    end
    released = true
    within('section[aria-label="Candidate forms"]') { expect(page).not_to have_text("Loading form history") }
    header = find("h2", text: "Synthetic Screening Candidate", exact_text: true).find(:xpath, "../..")
    expect(header).to have_text("Shortlisted")
    expect(application.reload.stage).to eq("shortlisted")
    expect(@console_errors).to eq([])
  ensure
    released = true
  end

  it "does not rebase unsaved choices when history pagination observes another admin's update" do
    21.times do |index|
      application.reload
      Hiring::Screening.new(application:, actor: admin, attributes: {
        "company_id" => company.id, "lock_version" => application.lock_version,
        "action" => "request_information", "reason" => "Retained screening #{index + 1}"
      }).process
    end
    open_screening
    role = company.hiring_roles.create!(title: "Role assigned by another admin")
    within('section[aria-label="Screening"]') do
      expect(page).to have_css("p", text: "Retained screening 21", exact_text: true)
      expect(page).not_to have_css("p", text: "Retained screening 1", exact_text: true)
      select "Shortlist", from: "Screening action"
      fill_in "Screening reason", with: "My unsaved screening draft"
      application.reload.update!(hiring_role: role)
      click_button "Next screening page"
      expect(page).to have_css("p", text: "Retained screening 1", exact_text: true)
      expect(page).not_to have_css("p", text: "Retained screening 21", exact_text: true)
      click_button "Save screening"
      expect(page).to have_css('[role="alert"]', text: "changed")
      expect(page).to have_field("Screening reason", with: "My unsaved screening draft")
    end
    expect(application.reload).to have_attributes(stage: "information_pending", hiring_role_id: role.id)
    expect(application.hiring_screenings.count).to eq(21)
    expect(@console_errors).to eq([])
  end
end
