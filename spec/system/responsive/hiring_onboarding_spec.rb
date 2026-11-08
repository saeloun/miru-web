# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring onboarding handoff", type: :system, js: true do
  include_context "issued offer records"
  include_context "hiring SMTP transport"
  let(:company) { create(:company, name: "Synthetic Onboarding Company") }
  let(:candidate_name) { "Synthetic Candidate" }
  let(:engagement) { "consultant" }

  before do |example|
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    @offer = example.metadata[:browser_acceptance] ? issued_offer_record : accepted_offer_record(engagement:)
    sign_in admin
  end

  around do |example|
    original = Api::V1::Hiring::BaseController.allow_forgery_protection
    signatures_original = Api::V1::SignatureRequestsController.allow_forgery_protection
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    Api::V1::SignatureRequestsController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = original
    Api::V1::SignatureRequestsController.allow_forgery_protection = signatures_original
  end
  after { expect(@console_errors).to eq([]) }

  def open_onboarding(width: 1440)
    page.current_window.resize_to(width, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "Review offers"
    click_button "Review onboarding for offer #{@offer.id}"
    expect(page).to have_button("Reload onboarding", disabled: false)
  end

  def capture(name, full: true)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_ONBOARDING_SHOTS"]

    folder = Rails.root.join(ENV.fetch("HIRING_ONBOARDING_SHOTS"))
    FileUtils.mkdir_p(folder)
    page.save_screenshot(folder.join("#{name}.png"), full:)
  end

  it "confirms an invitation, lets its recipient create the consultant account, and opens the exact future profile and generic upload", :browser_acceptance do
    using_session(:candidate) do
      page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
      page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
      visit "/hiring-offer##{@offer.access_token}"
      expect(page).to have_text("125000.50 INR / monthly")
      check "I have reviewed these offer terms"
      click_button "Accept offer"
      expect(page).to have_text("Your acceptance is recorded")
      capture("candidate-offer-accepted")
    end
    expect(@offer.reload.state).to eq("accepted")
    open_onboarding
    expect(page).to have_button("Confirm onboarding", disabled: true)
    fill_in "Onboarding first name", with: "Taylor"
    fill_in "Onboarding last name", with: "Candidate"
    find_field("I confirm this accepted offer and the reviewed profile or invitation").native.node.focus
    page.driver.browser.keyboard.type(:space)
    click_button "Confirm onboarding"
    expect(page).to have_text("The recipient must accept before a profile is created.")
    expect(User.exists?(email: "candidate@example.test")).to be(false)
    capture("account-invitation-desktop")
    invitation = company.invitations.sole
    emailed_link = nil
    with_smtp_response do |commands, messages, port|
      previous = [UserInvitationMailer.delivery_method, UserInvitationMailer.smtp_settings, UserInvitationMailer.perform_deliveries]
      begin
        UserInvitationMailer.delivery_method = :smtp
        UserInvitationMailer.perform_deliveries = true
        UserInvitationMailer.smtp_settings = { address: "127.0.0.1", port:, domain: "localhost", enable_starttls: false,
          enable_starttls_auto: false, open_timeout: 2, read_timeout: 2 }
        allow(UserInvitationMailer).to receive(:default_url_options).and_return(host: "localhost", port: Capybara.server_port, protocol: "http")
        perform_enqueued_jobs(only: ActionMailer::MailDeliveryJob)
      ensure
        UserInvitationMailer.delivery_method, UserInvitationMailer.smtp_settings, UserInvitationMailer.perform_deliveries = previous
      end
      expect(commands.count("DATA")).to eq(1)
      mail = Mail.read_from_string(messages.sole)
      expect(mail.to).to eq(["candidate@example.test"])
      body = mail.html_part&.body&.decoded || mail.body.decoded
      expect(body).not_to include("125000.50", "PRIVATE")
      emailed_link = Nokogiri::HTML(body).css("a[href]").map { |link| link["href"] }.find { |url| url.include?("/invitations/accepts?") }
      expect(emailed_link).to start_with("http://localhost:#{Capybara.server_port}/invitations/accepts?")
      expect(Rack::Utils.parse_nested_query(URI.parse(emailed_link).query)["token"]).to eq(invitation.token)
    end

    using_session(:candidate) do
      visit emailed_link
      click_button "Accept invitation"
      expect(page).to have_text("Reset Password")
      fill_in "password", with: "Password1!"
      fill_in "confirm_password", with: "Password1!"
      click_button "Reset Password"
      expect(page).to have_current_path("/").or have_current_path("/dashboard").or have_current_path("/time-tracking")
    end
    employment = @offer.reload.employment
    expect(employment.employment_type).to eq("contractor")
    expect(employment.compensation_versions).to be_empty
    open_onboarding(width: 390)
    expect(page).to have_text("Onboarding complete")
    capture("completed-consultant-mobile")
    click_link "View employee record"
    expect(page).to have_current_path("/team/#{employment.user_id}/employee-records")
    expect(page).to have_text("Taylor Candidate")
    capture("future-staff-record-mobile")
    open_onboarding
    click_link "Upload agreement documents"
    expect(page).to have_text("Upload documents")
    expect(page).to have_select("Linked profile", selected: "Taylor Candidate — candidate@example.test")
    expect(page).to have_no_text("125000.50")
    capture("generic-upload-prefill")
    fill_in "Document title", with: "Synthetic consultant onboarding agreement"
    files = %w[qa-main.pdf qa-addendum.pdf].map { |name| Rails.root.join("docs/qa/generic-document-signing-2462", name) }
    attach_file "PDF documents", files
    click_button "Create signing draft"
    expect(page).to have_current_path(%r{/agreements/documents/\d+})
    expect(page).to have_css('[data-pdf-ready="true"]')
    click_button "Add recipient"
    within("fieldset[aria-label='Recipient 1']") do
      fill_in "Name", with: "Taylor Candidate"
      fill_in "Email", with: "candidate@example.test"
    end
    click_button "Add field"
    fill_in "Field label", with: "Consultant agreement signature"
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    signature = SignatureRequest.find_by!(title: "Synthetic consultant onboarding agreement")
    expect(signature.employment_id).to eq(employment.id)
    expect(signature.company_id).to eq(company.id)
    expect(signature.current_revision.documents.size).to eq(2)
    signature.current_revision.documents.each_with_index do |document, index|
      bytes = signature.current_revision.original_bytes(document.fetch("key")).first
      expect(Digest::SHA256.hexdigest(bytes)).to eq(Digest::SHA256.file(files[index]).hexdigest)
    end
    expect(signature.current_revision.fields.sole.fetch("label")).to eq("Consultant agreement signature")
    expect(signature.current_revision.status).to eq("draft")
    expect(signature.current_revision.provider_envelope_id).to be_nil
    expect(page).to have_no_text("Loading PDF preview…")
    capture("generic-pdf-fields-desktop", full: false)
    page.current_window.resize_to(390, 844)
    expect(page).to have_css('[data-pdf-ready="true"]')
    expect(page).to have_no_text("Loading PDF preview…")
    capture("generic-pdf-fields-mobile", full: false)
  end

  it "renews a missing or expired invitation only after explicit mobile review" do
    Hiring::Onboarding.new(application:, offer: @offer, actor: admin).start!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "offer_version" => @offer.lock_version,
      "first_name" => "Taylor", "last_name" => "Candidate", "employment_id" => nil, "employment_updated_at" => nil,
      "invitation_id" => nil, "invitation_updated_at" => nil, "send_invitation" => true })
    invitation = company.invitations.sole
    previous_token = invitation.token
    invitation.update!(expired_at: 1.minute.ago)
    open_onboarding(width: 390)
    expect(page).to have_text("Reviewed member: Taylor Candidate")
    expect(page).to have_button("Renew account invitation", disabled: true)
    check "I confirm this accepted offer and the reviewed profile or invitation"
    click_button "Renew account invitation"
    expect(page).to have_text("Account invitation prepared.")
    expect(page).to have_no_button("Renew account invitation")
    expect(invitation.reload.token).not_to eq(previous_token)
    expect(User.exists?(email: "candidate@example.test")).to be(false)
    capture("invitation-renewed-mobile")
  end

  it "clears the whole private application after a server-side workspace change" do
    open_onboarding
    fill_in "Onboarding first name", with: "Private draft"
    other = create(:company)
    create(:employment, company: other, user: admin, resigned_at: nil)
    admin.add_role(:admin, other)
    admin.update!(current_workspace_id: other.id)
    click_button "Reload onboarding"
    expect(page).to have_text(/workspace changed/i)
    expect(page).to have_no_text(candidate_name)
    expect(page).to have_no_field("Onboarding first name")
  end

  it "clears the private source and local form after Admin authority is revoked" do
    open_onboarding
    fill_in "Onboarding first name", with: "Private draft"
    admin.remove_role(:admin, company)
    click_button "Reload onboarding"
    expect(page).to have_no_text(candidate_name)
    expect(page).to have_no_field("Onboarding first name")
    expect(company.invitations).to be_empty
  end

  context "with employee terms" do
    let(:engagement) { "employee" }

    it "links an existing salaried profile without altering its employment or private records" do
      user = create(:user, email: "candidate@example.test")
      employment = create(:employment, company:, user:, employment_type: "salaried", designation: "Existing role", resigned_at: nil)
      user.add_role(:employee, company)
      private_record = employment.create_employee_record!(private_details: { "bank_account_number" => "123456789012" })
      original = [user.reload.attributes, employment.reload.attributes, private_record.reload.private_details]
      open_onboarding
      expect(page).to have_field("Onboarding first name", with: user.first_name, readonly: true)
      expect(page).to have_no_text("123456789012")
      check "I confirm this accepted offer and the reviewed profile or invitation"
      click_button "Confirm onboarding"
      expect(page).to have_text("Onboarding complete")
      expect(@offer.reload.employment_id).to eq(employment.id)
      expect([user.reload.attributes, employment.reload.attributes, private_record.reload.private_details]).to eq(original)
      expect(company.invitations).to be_empty
      capture("existing-employee-linked-desktop")
    end
  end
end
