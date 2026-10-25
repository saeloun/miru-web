# frozen_string_literal: true

require "rails_helper"
require "tmpdir"

RSpec.describe "Signed document archives", type: :system, js: true do
  include SignatureRequestFixtures

  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, joined_at: nil, resigned_at: nil) }
  let!(:employment) { create(:employment, company:, user: employee, joined_at: nil, resigned_at: nil) }
  let(:provider) { instance_double(Signatures::DocumensoClient, origin: "https://signing.example.test") }

  around do |example|
    travel_to(Time.utc(2026, 10, 25)) { example.run }
  end

  before do
    admin.add_role(:owner, company)
    employee.add_role(:employee, company)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(nil)
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return("https://signing.example.test")
    allow(ENV).to receive(:[]).with("DOCUMENSO_SEAL_SHA256").and_return("eae7b329c848bdcbf3cc96829203a3dfddf922dc36b3afc4f03a14ff65b32ad7")
    allow(Signatures::DocumensoClient).to receive(:new).and_return(provider)
    @connection = SignatureConnection.create!(company:, created_by: admin, api_key: "synthetic_key",
      provider_origin: "https://signing.example.test")
  end

  def archive(client: nil, employment: nil)
    completed_signature_request(company:, actor: admin, connection: @connection, provider:, client:, employment:)
  end

  def open_page(actor, path)
    sign_in actor
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    visit path
  end

  def download_artifact(entry)
    Dir.mktmpdir("signature-archive-download") do |directory|
      downloads = page.driver.browser.downloads
      downloads.set_behavior(save_path: directory)
      expect(downloads.wait(10) { click_button entry.fetch("filename"), exact: true }).to be(true)
      expect(Digest::SHA256.file(File.join(directory, entry.fetch("filename"))).hexdigest).to eq(entry.fetch("sha256"))
    end
  end

  def capture_archive(filename)
    page.execute_script("window.scrollTo({ top: 0, behavior: 'instant' })")
    page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      document.fonts.ready.then(() => Promise.all(document.getAnimations()
        .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
        .map(animation => animation.finished.catch(() => {}))))
        .then(() => requestAnimationFrame(() => requestAnimationFrame(done)));
    JS
    page.save_screenshot(Rails.root.join("tmp/capybara/#{filename}"), full: true)
  end

  it "shows an employee only their own archive and downloads all files at desktop and mobile widths" do
    own = archive(employment:)
    archive(client: create(:client, company:))
    open_page(employee, "/signed-documents")
    expect(page).to have_css("h1", text: "Signed documents")
    expect(page).to have_css("article[data-signature-archive]", count: 1)
    expect(page).to have_link("Signed documents", href: "/signed-documents")
    [1440, 375].each do |width|
      page.current_window.resize_to(width, 1000)
      expect(page).to have_css("article[data-signature-archive]") do |card|
        card.evaluate_script("this.getBoundingClientRect().width >= 280")
      end
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
      own.artifact_manifest.each { |entry| download_artifact(entry) }
      expect(@console_errors).to be_empty
      capture_archive("signed-documents-#{width}.png")
    end
  end

  it "offers verified downloads on the locked editor and the consultant's profile" do
    page.current_window.resize_to(1440, 1000)
    signed = archive(employment:)
    open_page(admin, "/agreements/documents/#{signed.signature_request_id}")
    expect(page).to have_css('[data-pdf-ready="true"]')
    expect(page).to have_content("Signed files saved in Miru")
    expect(page).not_to have_button("Cancel signature request")
    download_artifact(signed.artifact_manifest.first)
    capture_archive("signed-editor-downloads.png")
    visit "/team/#{employee.id}/employee-records?company_id=#{company.id}"
    expect(page).to have_css("h2", text: "Signed documents")
    expect(page).to have_css("article[data-signature-archive]", count: 1)
    download_artifact(signed.artifact_manifest.last)
    capture_archive("employee-signed-documents.png")
    expect(@console_errors).to be_empty
  end

  it "lists a client's signed documents on their profile without showing other parties' archives" do
    page.current_window.resize_to(1440, 1000)
    client = create(:client, company:)
    signed = archive(client:)
    archive(employment:)
    open_page(admin, "/clients/#{client.id}")
    expect(page).to have_css("h2", text: "Signed documents")
    expect(page).to have_css("article[data-signature-archive]", count: 1)
    download_artifact(signed.artifact_manifest.first)
    capture_archive("client-signed-documents.png")
    expect(@console_errors).to be_empty
  end

  it "keeps failed verification visible without a signed download or cancellation action" do
    record = approved_signature_request(company:, actor: admin)
    record.current_revision.update!(signature_connection: @connection, operation_id: SecureRandom.uuid,
      provider_envelope_id: "envelope_failed", provider_status: "COMPLETED", status: "awaiting_signatures", archive_error: "verification_failed")
    open_page(admin, "/agreements/documents/#{record.id}")
    expect(page).to have_css('[data-pdf-ready="true"]')
    expect(page).to have_content("Completed files could not be verified")
    expect(page).not_to have_button("Cancel signature request")
    expect(page).not_to have_css("button", text: /agreement-v\d+-document/)
    expect(page).to have_button("Check signing status")
    expect(@console_errors).to be_empty
  end

  it "shows an elapsed signing deadline and stops offering reminders before its callback arrives" do
    record = approved_signature_request(company:, actor: admin)
    record.current_revision.update!(signature_connection: @connection, operation_id: SecureRandom.uuid,
      provider_envelope_id: "envelope_expiring", provider_status: "PENDING", status: "awaiting_signatures",
      recipient_statuses: [{ "recipient_id" => "signer", "signing_status" => "NOT_SIGNED", "send_status" => "SENT",
        "read_status" => "OPENED", "expires_at" => 1.minute.ago.iso8601 }])
    open_page(admin, "/agreements/documents/#{record.id}")
    expect(page).to have_css('[data-pdf-ready="true"]')
    expect(page).to have_content("Signing window expired")
    expect(page).to have_content("Signing deadline:")
    expect(page).not_to have_button("Remind pending recipients")
    expect(page).not_to have_content("Next automatic reminder:")
    expect(page).not_to have_content("Signed files saved in Miru")
    expect(@console_errors).to be_empty
  end
end
