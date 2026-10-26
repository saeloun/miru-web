# frozen_string_literal: true

require "rails_helper"
require "tmpdir"

RSpec.describe "Hiring inbox", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Inbox QA") }
  let(:admin) { create(:user, first_name: "Synthetic", last_name: "Inbox Admin", current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:mailbox) { HiringMailbox.create!(company:, name: "Applications", source_email: "hello@example.test") }

  before { admin.add_role(:admin, company) }

  around do |example|
    controller = Api::V1::Hiring::BaseController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    controller.allow_forgery_protection = original if controller
  end

  def open_inbox(width: 1440)
    sign_in admin
    page.current_window.resize_to(width, 900)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    visit "/hiring"
    click_link "Email inbox"
    expect(page).to have_css("h2", text: "Email inbox")
  end

  def forwarded_email
    Mail.new do
      from "Internal Forwarder <internal@example.test>"
      to "hello@example.test"
      message_id "ui-inbox-42@example.test"
      subject "Fwd: Application for Rails developer"
      text_part { body "Please review this forwarded application. <script>untrusted</script>" }
      attachments["resume.txt"] = "Synthetic private resume"
    end.encoded
  end

  def receive_forward
    record = Hiring::ReceiveEmail.new(mailbox:, source: forwarded_email).process
    Hiring::EmailIntake.new(record).process
    record.reload
  end

  def capture(name)
    return unless ENV["MIRU_QA_SCREENSHOTS"] == "1"

    page.document.find("h2", match: :first).click
    page.save_screenshot(Rails.root.join("docs/qa/hiring-2463", name), full: true)
  end

  def expect_download(button, filename, bytes)
    Dir.mktmpdir("miru-hiring-downloads") do |directory|
      downloads = page.driver.browser.downloads
      downloads.set_behavior(save_path: directory)
      expect(downloads.wait(10) { click_button button, exact: true }).to be(true)
      expect(File.binread(File.join(directory, filename))).to eq(bytes)
    end
  end

  it "adds, renames and disables an inbox without claiming external forwarding is connected" do
    open_inbox
    click_link "Manage inboxes"
    within('form[aria-label="Add inbox"]') do
      fill_in "Inbox name", with: "Applications"
      fill_in "Inbox email", with: "hello@example.test"
      click_button "Add inbox"
    end
    expect(page).to have_text("Inbox added")
    record = company.hiring_mailboxes.sole
    within("[data-testid='mailbox-#{record.id}']") do
      fill_in "Inbox name", with: "Recruitment"
      click_button "Save name"
      expect(page).to have_css("h3", text: "Recruitment")
      click_button "Disable inbox"
      expect(page).to have_text("Disabled")
    end
    expect(record.reload.active?).to be(false)
    expect(page).to have_text("Forwarding must be configured separately")
    expect(@console_errors).to eq([])
    capture("inbox-management-desktop.png")
  end

  it "reviews a forward without mistaking its original sender for the applicant on mobile" do
    record = receive_forward
    open_inbox(width: 375)
    click_link "Fwd: Application for Rails developer"
    expect(page).to have_text("Original sender")
    expect(page).to have_text("internal@example.test")
    expect(find_field("Verified applicant name").value).to eq("")
    expect(find_field("Verified applicant email").value).to eq("")
    expect(page).to have_button("Download original email")
    expect(page).to have_button("Download resume.txt")
    expect_download("Download original email", "hiring-email-#{record.id}.eml", record.raw_email.download)
    expect_download("Download resume.txt", "resume.txt", "Synthetic private resume")
    fill_in "Verified applicant name", with: "Synthetic Jaya Rao"
    fill_in "Verified applicant email", with: "jaya@example.test"
    click_button "Add or link application"
    expect(page).to have_text("Added or linked")
    expect(page).to have_link("Synthetic Jaya Rao")
    expect(record.reload.reviewed_by_id).to eq(admin.id)
    expect(record.hiring_application.hiring_candidate.email).to eq("jaya@example.test")
    expect(HiringMessage.count).to eq(0)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to eq(true)
    expect(@console_errors).to eq([])
    capture("inbox-reviewed-mobile.png")
    click_link "Synthetic Jaya Rao", exact: true
    expect(page).to have_css("h2", text: "Synthetic Jaya Rao", exact_text: true)
    expect(page).to have_css("dt", text: "Source", exact_text: true)
    expect(page).to have_css("dd", text: "Email intake", exact_text: true)
    expect(page).not_to have_css("dd", text: "Manual intake", exact_text: true)
    expect(@console_errors).to eq([])
    capture("email-application-detail-mobile.png")
  end

  it "preserves other inbox name edits and recovers a stale rename without overwriting it" do
    first = HiringMailbox.create!(company:, name: "First inbox", source_email: "first@example.test")
    second = HiringMailbox.create!(company:, name: "Second inbox", source_email: "second@example.test")
    open_inbox
    click_link "Manage inboxes"
    within("[data-testid='mailbox-#{first.id}']") { fill_in "Inbox name", with: "My unsaved inbox name" }
    within("[data-testid='mailbox-#{second.id}']") do
      fill_in "Inbox name", with: "Second saved inbox"
      click_button "Save name"
      expect(page).to have_css("h3", text: "Second saved inbox")
    end
    within("[data-testid='mailbox-#{first.id}']") { expect(page).to have_field("Inbox name", with: "My unsaved inbox name") }
    first.update!(name: "Changed elsewhere")
    within("[data-testid='mailbox-#{first.id}']") { click_button "Save name" }
    expect(page).to have_css('[role="alert"]', text: "changed")
    click_button "Reload inboxes"
    within("[data-testid='mailbox-#{first.id}']") do
      expect(page).to have_css("h3", text: "Changed elsewhere")
      expect(page).to have_field("Inbox name", with: "My unsaved inbox name")
      click_button "Discard name edits"
      expect(page).to have_field("Inbox name", with: "Changed elsewhere")
    end
    expect(first.reload.name).to eq("Changed elsewhere")
    expect(@console_errors).to eq([])
  end

  it "uploads an eml file into the selected active inbox and opens its retained receipt" do
    mailbox
    open_inbox
    find("#upload-mailbox").click
    find("[cmdk-item]", text: "hello@example.test").click
    Tempfile.create(["application", ".eml"]) do |file|
      file.binmode
      file.write(forwarded_email)
      file.flush
      attach_file "Email file", file.path
      click_button "Retain email"
      expect(page).to have_css("h2", text: "Retained email")
    end
    expect(page).to have_text("Processing")
    expect(company.hiring_receipts.count).to eq(1)
    expect(company.hiring_receipts.sole.raw_email).to be_attached
    expect(@console_errors).to eq([])
  end

  it "requests pending email processing without claiming completion and reloads the actual outcome" do
    record = Hiring::ReceiveEmail.new(mailbox:, source: forwarded_email).process.reload
    open_inbox(width: 375)
    select "All emails", from: "Email status"
    click_link "Email awaiting processing"
    click_button "Retry processing"
    expect(page).to have_css('[role="status"]', text: "Processing requested")
    expect(record.reload.state).to eq("pending")
    expect(record.audits.where(action: "intake_retry_requested", user: admin).count).to eq(1)
    HiringIntakeJob.perform_now(record.id)
    click_button "Reload email"
    expect(page).to have_text("Needs review")
    expect(page).not_to have_button("Retry processing")
    expect(@console_errors).to eq([])
  end

  it "previews the approved acknowledgement for an existing receipt and rejects changed wording before queuing" do
    record = receive_forward
    Hiring::ReviewReceipt.new(company:, actor: admin, receipt: record).accept!(
      full_name: "Synthetic Jaya Rao", email: "jaya@example.test", lock_version: record.lock_version)
    config = Hiring::Configure.new(company:, actor: admin)
    details = HiringSetting::TEXT_FIELDS.index_with { |field| "Approved #{field}" }.merge("client_count" => 3)
    draft = config.save_draft!(details:, lock_version: nil)
    approved = config.approve!(lock_version: draft.lock_version)
    record.hiring_application.update!(stage: "withdrawn")
    open_inbox
    select "All emails", from: "Email status"
    click_link "Fwd: Application for Rails developer"
    within('section[aria-label="Queue acknowledgement"]') do
      expect(page).to have_text("jaya@example.test")
      expect(page).to have_text("Approved acknowledgement_subject")
      expect(page).not_to have_text("internal@example.test")
      expect(page).to have_button("Queue this acknowledgement", disabled: true)
      expect(page).to have_text("Closed applications cannot receive an acknowledgement.")
    end
    record.hiring_application.update!(stage: "received")
    click_button "Reload email"
    expect(page).to have_button("Queue this acknowledgement", disabled: false)
    draft = config.save_draft!(details: details.merge("acknowledgement_subject" => "New approved wording"), lock_version: approved.lock_version)
    config.approve!(lock_version: draft.lock_version)
    click_button "Queue this acknowledgement"
    expect(page).to have_css('[role="alert"]', text: "communication settings changed")
    expect(HiringMessage.count).to eq(0)
    click_button "Reload email"
    within('section[aria-label="Queue acknowledgement"]') { expect(page).to have_text("New approved wording") }
    click_button "Queue this acknowledgement"
    within('section[aria-label="Acknowledgement history"]') do
      expect(page).to have_text("Queued")
      expect(page).to have_text("To: jaya@example.test")
      expect(page).to have_text("New approved wording")
    end
    expect(page).not_to have_button("Queue this acknowledgement")
    expect(company.hiring_messages.sole.queued_by_id).to eq(admin.id)
    expect(@console_errors).to eq([])
    capture("inbox-queued-existing-desktop.png")
  end

  it "queues an approved acknowledgement to the verified applicant and clears completed review edits" do
    config = Hiring::Configure.new(company:, actor: admin)
    details = HiringSetting::TEXT_FIELDS.index_with { |field| "Approved #{field}" }.merge("client_count" => 3)
    draft = config.save_draft!(details:, lock_version: nil)
    config.approve!(lock_version: draft.lock_version)
    record = receive_forward
    open_inbox
    click_link "Fwd: Application for Rails developer"
    fill_in "Verified applicant name", with: "Synthetic Jaya Rao"
    fill_in "Verified applicant email", with: "jaya@example.test"
    find('form[aria-label="Review email"] input[type="checkbox"]').check
    click_button "Add or link application"
    within('section[aria-label="Acknowledgement history"]') do
      expect(page).to have_text("Queued")
      expect(page).to have_text("To: jaya@example.test")
      expect(page).not_to have_text("internal@example.test")
    end
    expect(company.hiring_messages.sole.hiring_application_id).to eq(record.reload.hiring_application_id)
    expect(page).to have_button("Reload email")
    expect(@console_errors).to eq([])
  end

  it "links an original email to an existing application and records a separate dismissal" do
    record = receive_forward
    application = Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => "Synthetic Jaya Existing", "email" => "jaya@example.test" }).process
    open_inbox
    click_link "Fwd: Application for Rails developer"
    fill_in "Verified applicant name", with: "Synthetic Jaya Updated"
    fill_in "Verified applicant email", with: "jaya@example.test"
    find("#review-application").click
    find("[cmdk-item]", text: "jaya@example.test").click
    click_button "Add or link application"
    expect(page).to have_link("Synthetic Jaya Existing")
    expect(record.reload.hiring_application_id).to eq(application.id)
    expect(company.hiring_applications.count).to eq(1)
    copy = Mail.from_source(forwarded_email)
    copy.message_id = "other-forward-ui@example.test"
    second = Hiring::ReceiveEmail.new(mailbox:, source: copy.encoded).process
    Hiring::EmailIntake.new(second).process
    visit "/hiring/inbox/#{second.id}"
    click_button "Dismiss email"
    expect(page).to have_text("Dismissed")
    expect(second.reload.state).to eq("dismissed")
    expect(company.hiring_applications.count).to eq(1)
    expect(@console_errors).to eq([])
  end

  it "preserves attempts and requires an evidenced delivery review before retrying an unknown outcome" do
    config = Hiring::Configure.new(company:, actor: admin)
    details = HiringSetting::TEXT_FIELDS.index_with { |field| "Approved #{field}" }.merge("client_count" => 3)
    draft = config.save_draft!(details:, lock_version: nil)
    approved = config.approve!(lock_version: draft.lock_version)
    record = receive_forward
    Hiring::ReviewReceipt.new(company:, actor: admin, receipt: record).accept!(
      full_name: "Synthetic Jaya Rao", email: "jaya@example.test", lock_version: record.lock_version, acknowledge: true)
    first = company.hiring_messages.sole
    original = first.content
    first.update!(state: "failed", error_code: "transport_rejected")
    draft = config.save_draft!(details: details.merge("acknowledgement_subject" => "Revised acknowledgement"), lock_version: approved.lock_version)
    config.approve!(lock_version: draft.lock_version)
    open_inbox(width: 375)
    select "All emails", from: "Email status"
    click_link "Fwd: Application for Rails developer"
    within('section[aria-label="Retry acknowledgement"]') do
      expect(page).to have_text("Revised acknowledgement")
      expect(page).to have_text("jaya@example.test")
      click_button "Queue new attempt"
    end
    expect(page).to have_text("Attempt 2")
    second = company.hiring_messages.order(:id).last
    expect(first.reload.content).to eq(original)
    second.update!(state: "uncertain", error_code: "transport_unknown")
    click_button "Reload email"
    within("[data-testid='hiring-attempt-#{second.id}']") do
      expect(page).to have_text("Delivery unknown")
      expect(page).not_to have_button("Queue new attempt")
      select "Mail server did not accept", from: "Verified provider outcome"
      fill_in "Evidence for this review", with: "Synthetic provider log 42; original worker exit verified."
      click_button "Record delivery review"
      expect(second.reload.resolution).to be_nil
      capture("inbox-unknown-review-mobile.png")
      check "Original worker has stopped"
      second.update!(error_code: "interrupted")
      click_button "Record delivery review"
      expect(page).to have_css('[role="alert"]', text: "This attempt changed")
      expect(page).to have_field("Evidence for this review", with: "Synthetic provider log 42; original worker exit verified.")
      capture("inbox-stale-delivery-review-mobile.png")
    end
    click_button "Discard review edits and reload"
    expect(page).to have_text("Interrupted")
    within("[data-testid='hiring-attempt-#{second.id}']") do
      select "Mail server did not accept", from: "Verified provider outcome"
      fill_in "Evidence for this review", with: "Synthetic provider log 42; original worker exit verified."
      check "Original worker has stopped"
      click_button "Record delivery review"
      expect(page).to have_text("Operator reported: Not accepted")
    end
    expect(company.hiring_messages.count).to eq(2)
    expect(page).to have_text("This did not send an email.")
    click_button "Queue new attempt"
    expect(page).to have_text("Attempt 3")
    expect(company.hiring_messages.count).to eq(3)
    expect(first.reload.content).to eq(original)
    expect(second.reload.resolution_details.fetch("evidence")).to include("Synthetic provider log 42")
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to eq(true)
    expect(@console_errors).to eq([])
    capture("inbox-attempt-history-mobile.png")
  end
end
