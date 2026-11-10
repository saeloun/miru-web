# frozen_string_literal: true

require "rails_helper"
require "tmpdir"
require "timeout"

RSpec.describe "Consultant billing identity", type: :system, js: true do
  PAN = "ABCDE1234F"
  GST = "27ABCDE1234F1A5"
  let(:company) { create(:company, name: "Synthetic Consultancy") }
  let(:consultant) { create(:user, first_name: "Synthetic", last_name: "Consultant", current_workspace: company) }
  let(:owner) { create(:user, current_workspace: company) }
  let(:accounts) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: consultant, joined_at: "2026-01-01", resigned_at: nil) }
  let(:run) { PayrollRun.create!(company:, period: Date.current.beginning_of_month, currency: "INR", accounts_reviewer: accounts, final_reviewer: owner) }
  let(:console_errors) { [] }

  around { |example| travel_to(Time.utc(2026, 11, 9, 12)) { with_forgery_protection { example.run } } }

  before do
    [owner, accounts].each { |actor| create(:employment, company:, user: actor, joined_at: "2026-01-01", resigned_at: nil) }
    consultant.add_role(:employee, company)
    owner.add_role(:owner, company)
    accounts.add_role(:book_keeper, company)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("true")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(company.id.to_s)
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2026-01-01", monthly_fee: "50000",
      hours_per_day: "8", weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic India entity",
      change_reason: "Synthetic consultant engagement")
    run
  end

  after { expect(console_errors).to eq([]) }

  def sign_in_at_width(actor, width)
    sign_in(actor)
    @width = width
    page.current_window.resize_to(width, 1000)
    expect(page.evaluate_script("window.innerWidth")).to eq(width)
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| console_errors << event }
  end

  def open_identity(actor = consultant, width = 1440)
    sign_in_at_width(actor, width)
    if actor.id == consultant.id
      visit "/settings/profile"
      link = find_link("Billing identity", href: "/settings/billing-identity")
      page.scroll_to(link, align: :center)
      link.click
    else
      visit "/settings/billing-identity?user_id=#{consultant.id}"
    end
    expect(page).to have_css("h1", text: "Consultant billing identity", exact_text: true)
    expect(page).to have_button("Refresh billing identity", disabled: false)
    expect(page).to have_text(consultant.full_name)
  end

  def press(name)
    control = find_button(name, exact: true)
    page.scroll_to(control, align: :center)
    control.click
  end

  def fill_address
    fill_in "Legal name", with: "Synthetic Consultant Legal"
    fill_in "Billing address line 1", with: "1 Synthetic Road"
    fill_in "City", with: "Pune"
    fill_in "State or region", with: "Maharashtra"
    fill_in "Postal code", with: "411001"
  end

  def start_provided(gst: "GST registered")
    press "Add billing identity"
    fill_address
    select "PAN provided", from: "PAN status"
    fill_in "PAN number", with: PAN
    select gst, from: "GST status"
    attach_file "PAN evidence", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
    if gst == "GST registered"
      fill_in "GST number", with: GST
      select "Regular", from: "GST scheme"
      attach_file "GST evidence", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
    else
      fill_in "GST explanation", with: "Synthetic declared registration facts require accounts review"
    end
  end

  def submitted
    press "Submit billing identity"
    expect(page).to have_css("[role='status']", text: "Awaiting accounts review", exact_text: true)
    expect(page).to have_no_field("Legal name", disabled: :all)
    expect(page).to have_no_text(PAN)
    expect(page).to have_no_text(GST)
  end

  def approve(reason = "Reviewed declared identity and manual tax treatment")
    select "Approve declared identity", from: "Review decision"
    fill_in "Accounts review reason", with: reason
    expect(page).to have_button("Record accounts review", disabled: true)
    check "I reviewed the tax treatment manually"
    press "Record accounts review"
    expect(page).to have_css("[role='status']", text: "Accounts reviewed", exact_text: true)
  end

  def download_pan
    Dir.mktmpdir("billing-identity-download") do |directory|
      downloads = page.driver.browser.downloads
      downloads.set_behavior(save_path: directory)
      expect(downloads.wait(10) { press "Download PAN evidence" }).to be(true)
      expect(File.binread(File.join(directory, "pan-evidence.pdf"))).to eq(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")))
    end
  end

  def capture(name, control)
    return unless ENV["BILLING_IDENTITY_SHOTS"]

    expect(page.evaluate_script("window.innerWidth")).to eq(@width)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    page.scroll_to(control, align: :center)
    area = page.evaluate_script("({x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight})")
    FileUtils.mkdir_p(ENV.fetch("BILLING_IDENTITY_SHOTS"))
    page.save_screenshot(File.join(ENV.fetch("BILLING_IDENTITY_SHOTS"), "#{name}-#{@width}.png"), area:)
  end

  it "keeps the billing identity link under the pointer while profile sections finish loading" do
    profile_waiting = Queue.new
    release_profile = Queue.new
    allow_any_instance_of(Api::V1::Users::PreviousEmploymentsController).to receive(:index).and_wrap_original do |original|
      result = original.call
      profile_waiting << true
      Timeout.timeout(Capybara.default_max_wait_time) { release_profile.pop }
      result
    end

    sign_in_at_width(consultant, 1440)
    page.current_window.resize_to(1440, 1400)
    visit "/settings/profile"
    link = find_link("Billing identity", href: "/settings/billing-identity")
    Timeout.timeout(Capybara.default_max_wait_time) { profile_waiting.pop }
    before = link.evaluate_script("this.getBoundingClientRect().toJSON()")
    x = before.fetch("x") + before.fetch("width") / 2
    y = before.fetch("y") + before.fetch("height") / 2
    expect(y).to be_between(0, 1400)
    page.driver.browser.mouse.move(x:, y:)
    release_profile << true
    within("#account-security") { expect(page).to have_no_css("[role='status']") }
    after = link.evaluate_script("this.getBoundingClientRect().toJSON()")
    if ENV["PROFILE_NAV_SHOTS"]
      FileUtils.mkdir_p(ENV.fetch("PROFILE_NAV_SHOTS"))
      area = page.evaluate_script("({ x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight })")
      page.save_screenshot(File.join(ENV.fetch("PROFILE_NAV_SHOTS"), "profile-link-settled-1440.png"), area:)
    end
    page.driver.browser.mouse.down.up
    expect(page).to have_css("h1", text: "Consultant billing identity", exact_text: true),
      "The ordinary click targeted the initial link at #{before.inspect}; after profile loading it was at #{after.inspect}"
  ensure
    release_profile << true
  end

  [1440, 375].each do |width|
    it "submits private facts, reviews an exact version, revokes approval and explicitly reuses evidence at #{width}px" do
      open_identity(consultant, width)
      expect(page).to have_no_field("Review decision")
      start_provided
      capture("declared-evidence", find_field("PAN evidence"))
      submitted
      first = ConsultantBillingSubmission.sole
      expect(ConsultantBillingReview.count).to eq(0)
      expect(ConsultantInvoiceAuthorization.count).to eq(0)
      sign_in_at_width(accounts, width)
      expect(EmployeeRecordPolicy.new(accounts, employment).show?).to be(false)
      visit "/payroll/#{run.id}"
      link = find_link("Billing identity", href: "/settings/billing-identity?user_id=#{consultant.id}")
      page.scroll_to(link, align: :center)
      link.click
      expect(page).to have_field("Review decision")
      expect(page).to have_no_button("Revise billing identity")
      expect(page).to have_no_text(PAN)
      press "Show tax identifiers"
      expect(page).to have_text(PAN)
      expect(page).to have_text(GST)
      press "Hide tax identifiers"
      download_pan
      approve
      expect(ConsultantBillingReview.sole.submission_id).to eq(first.id)
      capture("accounts-reviewed", find("h2", text: "Submission #{first.id}", exact_text: false))
      select "Request more information", from: "Review decision"
      fill_in "Accounts review reason", with: "Correct legal-name spelling before new payment work"
      press "Record accounts review"
      expect(page).to have_css("[role='status']", text: "More information required", exact_text: true)
      expect(ConsultantBillingReview.count).to eq(2)
      expect(page).to have_text("Reviewed declared identity and manual tax treatment")
      open_identity(consultant, width)
      press "Revise billing identity"
      fill_in "Legal name", with: "Synthetic Consultant Corrected"
      expect(page).to have_unchecked_field("Reuse PAN evidence from version #{first.id}")
      check "Reuse PAN evidence from version #{first.id}"
      check "Reuse GST evidence from version #{first.id}"
      submitted
      second = ConsultantBillingSubmission.order(:id).last
      expect(second.previous_submission_id).to eq(first.id)
      expect(second.pan_blob_id).to eq(first.pan_blob_id)
      expect(second.gst_blob_id).to eq(first.gst_blob_id)
      expect(page).to have_no_field("Review decision")
      open_identity(accounts, width)
      approve("Reviewed corrected version and unchanged evidence")
      expect(ConsultantBillingReview.order(:id).last.submission_id).to eq(second.id)
      press "View version #{first.id}"
      expect(page).to have_css("h2", text: "Submission #{first.id} · Earlier version", exact_text: true)
      expect(page).to have_no_field("Review decision")
      download_pan
      expect(ConsultantBillingSubmission.count).to eq(2)
      expect(ConsultantInvoiceAuthorization.count).to eq(0)
    end
  end

  it "requires explicit manual missing-PAN treatment and permits approval revocation while payroll is disabled" do
    open_identity
    start_provided
    select "PAN not available", from: "PAN status"
    expect(page).to have_no_field("PAN evidence")
    expect(page).to have_no_text("Selected PAN file:")
    fill_in "PAN explanation", with: "PAN not currently available; accounts must determine manual treatment"
    select "Not GST registered", from: "GST status"
    expect(page).to have_no_field("GST evidence")
    expect(page).to have_no_text("Selected GST file:")
    fill_in "GST explanation", with: "Not registered; no automatic exemption assumed"
    submitted
    open_identity(accounts)
    select "Approve declared identity", from: "Review decision"
    fill_in "Accounts review reason", with: "Manual withholding review recorded; no exemption or zero withholding assumed"
    check "I reviewed the tax treatment manually"
    expect(page).to have_button("Record accounts review", disabled: true)
    check "I reviewed the missing PAN and recorded its manual treatment in the reason"
    press "Record accounts review"
    expect(page).to have_css("[role='status']", text: "Accounts reviewed", exact_text: true)
    expect(ConsultantBillingReview.sole.missing_pan_acknowledged).to be(true)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    press "Refresh billing identity"
    expect(page).to have_select("Review decision", disabled_options: ["Approve declared identity"])
    select "Reject declared identity", from: "Review decision"
    fill_in "Accounts review reason", with: "Manual review withdrawn pending corrected facts"
    press "Record accounts review"
    expect(page).to have_css("[role='status']", text: "Submission rejected", exact_text: true)
    expect(ConsultantBillingReview.count).to eq(2)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("true")
    open_identity
    press "Revise billing identity"
    select "PAN provided", from: "PAN status"
    expect(page).to have_no_field("PAN explanation")
    fill_in "PAN number", with: PAN
    attach_file "PAN evidence", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
    submitted
    expect(ConsultantBillingSubmission.heads.sole.facts["pan_reason"]).to eq("")
  end

  it "blocks unresolved GST approval and keeps post-exit self correction separate from invoice consent" do
    open_identity(consultant, 375)
    start_provided(gst: "GST status needs review")
    submitted
    open_identity(accounts, 375)
    expect(page).to have_select("Review decision", disabled_options: ["Approve declared identity"])
    select "Request more information", from: "Review decision"
    fill_in "Accounts review reason", with: "Resolve GST status before approval"
    press "Record accounts review"
    open_identity(consultant, 375)
    employment.update!(resigned_at: Date.yesterday)
    visit "/settings/profile"
    link = find_link("Billing identity", href: "/settings/billing-identity")
    page.scroll_to(link, align: :center)
    link.click
    press "Revise billing identity"
    select "Not GST registered", from: "GST status"
    fill_in "GST explanation", with: "Corrected self-declared registration facts for past services"
    check "Reuse PAN evidence from version #{ConsultantBillingSubmission.sole.id}"
    submitted
    expect(ConsultantBillingSubmission.count).to eq(2)
    expect(ConsultantInvoiceAuthorization.count).to eq(0)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    press "Refresh billing identity"
    expect(page).to have_text("Synthetic Consultant Legal")
    expect(page).to have_no_button("Revise billing identity")
    expect(page).to have_no_text(PAN)
  end

  it "retains actual files and facts after validation fails instead of requiring reselection" do
    open_identity
    start_provided(gst: "Not GST registered")
    fill_in "PAN number", with: "BAD"
    press "Submit billing identity"
    expect(page).to have_css("[role='alert']")
    expect(ConsultantBillingSubmission.count).to eq(0)
    expect(page).to have_field("PAN number", with: "BAD")
    expect(page).to have_text("Selected PAN file: pdf-file.pdf")
    fill_in "PAN number", with: PAN
    fill_in "Legal name", with: "Synthetic Retained Draft"
    other = open_new_window
    within_window(other) do
      visit "/settings/billing-identity"
      start_provided(gst: "Not GST registered")
      submitted
    end
    other.close
    first = ConsultantBillingSubmission.sole
    press "Submit billing identity"
    expect(page).to have_css("[role='alert']")
    expect(page).to have_field("Legal name", with: "Synthetic Retained Draft", disabled: true)
    press "Refresh billing identity"
    expect(page).to have_button("Submit billing identity", disabled: true)
    press "Use current version as predecessor"
    expect(page).to have_field("Legal name", with: "Synthetic Retained Draft")
    expect(page).to have_text("Selected PAN file: pdf-file.pdf")
    submitted
    expect(ConsultantBillingSubmission.count).to eq(2)
    expect(ConsultantBillingSubmission.heads.sole.previous_submission_id).to eq(first.id)
    download_pan
  end

  def lose_committed_response(action)
    lose_response = true
    allow_any_instance_of(Api::V1::ConsultantBillingIdentitiesController).to receive(:render).and_wrap_original do |original, *arguments, **options|
      committed = action == "create" ? ConsultantBillingSubmission.exists? : ConsultantBillingReview.exists?
      if original.receiver.action_name == action && lose_response && committed
        lose_response = false
        original.receiver.render(json: { errors: "Synthetic response lost after commit" }, status: 503)
      else
        original.call(*arguments, **options)
      end
    end
  end

  it "retries the frozen upload after a committed response is lost and the page is refreshed" do
    lose_committed_response("create")
    open_identity
    start_provided(gst: "Not GST registered")
    press "Submit billing identity"
    expect(page).to have_css("[role='alert']", text: "Synthetic response lost after commit")
    first = ConsultantBillingSubmission.sole
    blobs = ActiveStorage::Blob.count
    expect(page).to have_text("Selected PAN file: pdf-file.pdf")
    press "Refresh billing identity"
    expect(page).to have_button("Retry previous submission", disabled: false)
    expect(page).to have_text("Selected PAN file: pdf-file.pdf")
    press "Retry previous submission"
    expect(page).to have_text("Billing identity submitted for accounts review.")
    expect(ConsultantBillingSubmission.sole.id).to eq(first.id)
    expect(ActiveStorage::Blob.count).to eq(blobs)
    download_pan
  end

  it "acknowledges an older upload retry without replacing a newer self-submitted version" do
    lose_committed_response("create")
    open_identity
    start_provided(gst: "Not GST registered")
    press "Submit billing identity"
    expect(page).to have_css("[role='alert']", text: "Synthetic response lost after commit")
    first = ConsultantBillingSubmission.sole
    other = open_new_window
    within_window(other) do
      visit "/settings/billing-identity"
      press "Revise billing identity"
      fill_in "Legal name", with: "Synthetic Newer Legal Name"
      check "Reuse PAN evidence from version #{first.id}"
      submitted
    end
    other.close
    second = ConsultantBillingSubmission.order(:id).last
    blobs = ActiveStorage::Blob.count
    press "Refresh billing identity"
    press "Retry previous submission"
    expect(page).to have_text("Earlier receipt confirmed. The current billing identity and review were not changed.")
    expect(page).to have_text("Synthetic Newer Legal Name")
    expect(ConsultantBillingSubmission.heads.sole.id).to eq(second.id)
    expect(ConsultantBillingSubmission.count).to eq(2)
    expect(ActiveStorage::Blob.count).to eq(blobs)
  end

  it "acknowledges an older approved-review retry after a newer review revoked it" do
    open_identity
    start_provided(gst: "Not GST registered")
    submitted
    open_identity(accounts)
    lose_committed_response("review")
    select "Approve declared identity", from: "Review decision"
    fill_in "Accounts review reason", with: "Original human tax review"
    check "I reviewed the tax treatment manually"
    press "Record accounts review"
    expect(page).to have_css("[role='alert']", text: "Synthetic response lost after commit")
    first = ConsultantBillingReview.sole
    other = open_new_window
    within_window(other) do
      visit "/settings/billing-identity?user_id=#{consultant.id}"
      select "Request more information", from: "Review decision"
      fill_in "Accounts review reason", with: "Newer review revoked approval"
      press "Record accounts review"
      expect(page).to have_css("[role='status']", text: "More information required", exact_text: true)
    end
    other.close
    press "Refresh billing identity"
    press "Retry previous review"
    expect(page).to have_text("Earlier receipt confirmed. The current billing identity and review were not changed.")
    expect(page).to have_css("[role='status']", text: "More information required", exact_text: true)
    expect(ConsultantBillingReview.count).to eq(2)
    expect(ConsultantBillingReview.heads.sole.previous_review_id).to eq(first.id)
  end
end
