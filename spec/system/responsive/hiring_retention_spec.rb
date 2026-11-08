# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Private hiring retention", type: :system, js: true do
  include SignatureRequestFixtures
  include_context "issued offer records"
  let(:company) { create(:company, name: "Synthetic Retention QA") }
  let(:candidate_name) { "Synthetic Retention Candidate" }
  let(:confirmation) { "I understand this permanently deletes this application's private hiring data" }

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

  def open_review(width: 1440)
    page.current_window.resize_to(width, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_css("h2", text: candidate_name)
    click_button "Review hiring data deletion"
    expect(page).to have_button("Permanently delete hiring data", disabled: true)
    expect(page).to have_field(confirmation)
    expect(page).to have_text("Pending onboarding invitations are cancelled.")
  end

  def capture(name)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_RETENTION_SHOTS"]

    folder = Rails.root.join(ENV.fetch("HIRING_RETENTION_SHOTS"))
    FileUtils.mkdir_p(folder)
    page.save_screenshot(folder.join("#{name}.png"), full: true)
  end

  def response_status(path)
    page.evaluate_async_script("fetch(arguments[0], {credentials: 'same-origin'}).then(response => arguments[1](response.status))", path)
  end

  it "confirms permanent deletion, revokes source downloads and preserves the onboarded profile and original legal PDFs" do
    offer = started_onboarding_record
    acceptance = CreateInvitedUserService.new(offer.onboarding_invitation.token)
    acceptance.process
    expect(acceptance.success).to be(true), acceptance.error_message
    employment = offer.reload.employment
    signature = approved_signature_request(company:, actor: admin, employment:)
    revision = signature.current_revision
    original = revision.original_bytes(revision.documents.first.fetch("key"))
    receipt = Hiring::ReceiveEmail.new(mailbox:, source: "From: Candidate <candidate@example.test>\r\nTo: hiring@example.test\r\nMessage-ID: <browser-retention@example.test>\r\nSubject: Private source\r\n\r\nPrivate candidate content").process
    receipt.reload.update!(hiring_application: application)
    blob = receipt.raw_email.blob
    source_path = "/api/v1/hiring/receipts/#{receipt.id}/source?company_id=#{company.id}"
    open_review
    expect(response_status(source_path)).to eq(200)
    capture("retention-review-desktop")
    find_field(confirmation).native.node.focus
    page.driver.browser.keyboard.type(:space)
    click_button "Permanently delete hiring data"
    expect(page).to have_text("Hiring application deleted")
    expect(page).to have_no_text(candidate_name)
    expect(page).to have_no_button("Review hiring data deletion")
    expect(response_status(source_path)).to eq(404)
    perform_enqueued_jobs(only: ActiveStorage::PurgeJob)
    expect(blob.service.exist?(blob.key)).to be(false)
    expect(employment.reload.employee_record).to be_present
    expect(signature.reload.current_revision.original_bytes(revision.documents.first.fetch("key"))).to eq(original)
    capture("retention-complete-desktop")
  end

  it "keeps automatic retention disabled until a period is saved and explicitly approved, then observes the daily job result" do
    approve
    application.update!(stage: "rejected")
    application.update_columns(created_at: 60.days.ago, updated_at: 60.days.ago)
    application.hiring_candidate.update_columns(created_at: 60.days.ago, updated_at: 60.days.ago)
    application.audits.update_all(created_at: 60.days.ago)
    page.current_window.resize_to(390, 900)
    visit "/hiring/communications"
    expect(page).to have_css("h2", text: "Hiring communications")
    expect(page).to have_unchecked_field("Automatically delete old closed applications")
    HiringRetentionJob.perform_now
    expect(application.reload).to be_present
    check "Automatically delete old closed applications"
    fill_in "Days after last hiring activity", with: "30"
    click_button "Save draft"
    expect(page).to have_text("Unapproved draft")
    HiringRetentionJob.perform_now
    expect(application.reload).to be_present
    click_button "Approve communications"
    expect(page).to have_text("Approved for new applications")
    expect(company.reload.hiring_setting.details).to include("retention_enabled" => true, "retention_days" => 30)
    capture("retention-policy-approved-mobile")
    open_review(width: 390)
    expect(HiringRetentionJob.perform_now).to eq(deleted: 1, skipped: 0)
    click_button "Reload deletion review"
    expect(page).to have_text("Hiring record unavailable")
    expect(page).to have_no_text(candidate_name)
    expect(page).to have_no_field(confirmation)
    capture("retention-scheduled-private-state-cleared-mobile")
  end

  it "keeps a stale deletion unconfirmed and clears every private field when the workspace changes" do
    open_review(width: 390)
    application.touch
    check confirmation
    click_button "Permanently delete hiring data"
    expect(page).to have_css('[role="alert"]', text: "application changed")
    expect(page).to have_no_field(confirmation)
    expect(application.reload).to be_present
    click_button "Reload deletion review"
    expect(page).to have_field(confirmation)
    other = create(:company)
    create(:employment, company: other, user: admin, resigned_at: nil)
    admin.add_role(:admin, other)
    admin.update!(current_workspace: other)
    click_button "Reload deletion review"
    expect(page).to have_text(/workspace changed/i)
    expect(page).to have_no_text(candidate_name)
    expect(page).to have_no_field(confirmation)
    expect(application.reload).to be_present
    capture("retention-workspace-private-state-cleared-mobile")
  end
end
