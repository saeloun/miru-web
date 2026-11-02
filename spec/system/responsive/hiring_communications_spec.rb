# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring communications", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Communications QA") }
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

  def open_communications(width: 1440)
    sign_in admin
    page.current_window.resize_to(width, 900)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    visit "/hiring"
    click_link "Communication settings"
    expect(page).to have_css("h2", text: "Hiring communications")
  end

  def fill_settings
    { "Company introduction" => "Synthetic company building software with client teams.",
      "Working arrangements" => "Remote; location agreed for each engagement.",
      "Working week" => "As specified in the role and engagement agreement.",
      "Overlap" => "Overlap is agreed for each role and client team.",
      "PTO and engagement policy" => "Employees and consultants follow their applicable engagement terms.",
      "Hiring process" => "We review applications and confirm the next step individually.",
      "Acknowledgement subject" => "We received your application",
      "Acknowledgement body" => "Thank you for your interest in our team." }.each { |label, value| fill_in label, with: value }
    fill_in "Client count", with: "0"
  end

  def capture(name)
    return unless ENV["MIRU_QA_SCREENSHOTS"] == "1"

    page.save_screenshot(Rails.root.join("docs/qa/hiring-2463", name), full: true)
  end

  it "keeps draft edits separate from explicit approval and previews the saved acknowledgement" do
    open_communications
    expect(page).to have_text("Unapproved draft")
    expect(find_field("Client count").value).to eq("")
    fill_in "Company introduction", with: "Incomplete draft"
    click_button "Save draft"
    expect(page).to have_text("Draft saved")
    expect(page).to have_button("Approve acknowledgement", disabled: true)
    fill_settings
    expect(page).to have_text("Save your edits to preview")
    click_button "Save draft"
    expect(page).to have_css('[data-testid="acknowledgement-preview"]', text: "Clients: 0")
    expect(page).to have_button("Approve acknowledgement", disabled: false)
    click_button "Approve acknowledgement"
    expect(page).to have_text("Approved for new applications")
    expect(company.reload.hiring_setting.approved?).to be(true)
    capture("communications-approved-desktop.png")
    fill_in "PTO and engagement policy", with: "Updated engagement-specific policy."
    expect(page).to have_text("Unsaved changes")
    expect(page).to have_button("Approve acknowledgement", disabled: true)
    click_button "Save draft"
    expect(page).to have_text("Unapproved draft")
    expect(company.reload.hiring_setting.approved_at).to be_nil
    expect(@console_errors).to eq([])
  end

  it "preserves an edited draft on a stale save and allows an explicit discard and reload on mobile" do
    open_communications(width: 375)
    fill_settings
    click_button "Save draft"
    expect(page).to have_text("Draft saved")
    fill_in "Company introduction", with: "My unsaved browser draft"
    saved = company.reload.hiring_setting
    Hiring::Configure.new(company:, actor: admin).save_draft!(details: saved.details.merge("client_count" => 7), lock_version: saved.lock_version)
    click_button "Save draft"
    expect(page).to have_css('[role="alert"]', text: "settings changed")
    expect(find_field("Company introduction").value).to eq("My unsaved browser draft")
    click_button "Discard edits and reload"
    expect(page).to have_field("Client count", with: "7")
    expect(find_field("Company introduction").value).not_to eq("My unsaved browser draft")
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to eq(true)
    expect(@console_errors).to eq([])
    capture("communications-draft-mobile.png")
  end

  it "requires approval for enabled forms and retains custom field identities across edits" do
    open_communications
    expect(page).to have_css("h3", text: "Candidate application form")
    fill_settings
    find('[aria-label="Enable candidate forms"]').click
    within('[data-field-id="phone"]') { find("label", exact_text: "Required").click }
    click_button "Add custom field"
    within('[data-custom-field="true"]') do
      fill_in "Field label", with: "Private portfolio explanation"
    end
    select_radix "Answer type", "Long text"
    within('[data-custom-field="true"]') do
      find("label", exact_text: "Required").click
      find("label", exact_text: "Restricted answer").click
    end
    expect(page).to have_button("Approve communications and form", disabled: true)
    click_button "Save draft"
    expect(page).to have_text("Draft saved")
    saved = company.reload.hiring_setting
    fields = saved.form.fetch("fields")
    custom = fields.find { |field| field["label"] == "Private portfolio explanation" }
    expect(custom).to include("type" => "textarea", "required" => true, "sensitive" => true)
    expect(fields.find { |field| field["id"] == "phone" }.fetch("required")).to be(true)
    expect(saved.form.fetch("enabled")).to be(true)
    expect(saved.approved?).to be(false)
    click_button "Approve communications and form"
    expect(page).to have_text("Approved for new applications")
    expect(saved.reload.approved?).to be(true)
    capture("candidate-form-settings-desktop.png")
    within('[data-custom-field="true"]') { fill_in "Field label", with: "Updated portfolio explanation" }
    click_button "Save draft"
    expect(page).to have_text("Unapproved draft")
    expect(saved.reload.form.fetch("fields").find { |field| field["id"] == custom["id"] })
      .to include("label" => "Updated portfolio explanation")
    expect(saved.approved_at).to be_nil
    expect(@console_errors).to eq([])
  end

  it "keeps a mobile custom-field draft after a stale save until the admin explicitly discards it" do
    configuration = Hiring::Configure.new(company:, actor: admin)
    details = HiringSetting::TEXT_FIELDS.index_with { |field| "Synthetic approved #{field}" }.merge("client_count" => 0)
    saved = configuration.save_draft!(details:, form: Hiring::Form.default_schema, lock_version: nil)
    configuration.approve!(lock_version: saved.lock_version)
    open_communications(width: 375)
    expect(page).to have_css("h3", text: "Candidate application form")
    click_button "Add custom field"
    within('[data-custom-field="true"]') { fill_in "Field label", with: "My unsaved field" }
    configuration.save_draft!(details: details.merge("client_count" => 7), lock_version: saved.reload.lock_version)
    click_button "Save draft"
    expect(page).to have_css('[role="alert"]', text: "settings changed")
    expect(page).to have_field("Field label", with: "My unsaved field")
    expect(page).to have_button("Approve acknowledgement", disabled: true)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to eq(true)
    capture("candidate-form-settings-stale-mobile.png")
    click_button "Discard edits and reload"
    expect(page).to have_field("Client count", with: "7")
    expect(page).not_to have_field("Field label", with: "My unsaved field")
    expect(@console_errors).to eq([])
  end
end
