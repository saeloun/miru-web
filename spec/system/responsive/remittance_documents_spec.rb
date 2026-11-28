# frozen_string_literal: true

require "rails_helper"
require "tmpdir"
require "timeout"

RSpec.describe "Private bank remittance documents", type: :system, js: true do
  self.use_transactional_tests = false
  include_context "committed consultant invoice"
  let(:console_errors) { [] }
  let!(:leg) { credited_invoice_leg.reload }
  before do
    worker.update!(first_name: "Synthetic", last_name: "Consultant", current_workspace: company)
    worker.add_role(:employee, company)
  end
  after { expect(console_errors).to eq([]) }

  def sign_in(actor)
    super
    browser_page = page.driver.browser.page
    browser_page.on("Runtime.consoleAPICalled") { |event| console_errors << "console.error" if event["type"] == "error" }
    browser_page.on("Runtime.exceptionThrown") { |_| console_errors << "uncaught exception" }
  end

  def press(label)
    button = find_button(label, exact: true)
    page.scroll_to(button, align: :center)
    button.click
  end

  def upload_evidence(note)
    select "FIRC", from: "Bank document type"
    attach_file "Bank-issued file (PDF, JPEG or PNG; up to 5 MiB)", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
    fill_in "Document note / correction reason", with: note
    press "Save bank document"
    expect(page).to have_text(note)
    expect(page).to have_text("Bank document received.")
  end

  it "freezes an uploading draft and restores the same file and command after failure" do
    waiting, release, commands = Queue.new, Queue.new, Queue.new
    fail_upload = true
    allow_any_instance_of(Payroll::RemittanceDocuments).to receive(:record!).and_wrap_original do |method, **input|
      commands << input.fetch(:idempotency_key)
      if fail_upload
        waiting << true
        Timeout.timeout(10) { release.pop }
        raise Payroll::Workflow::Conflict, "Synthetic upload failure"
      end
      method.call(**input)
    end
    sign_in worker
    page.current_window.resize_to(1440, 1000)
    visit "/settings/consultant-invoices"
    select "FIRC", from: "Bank document type"
    attach_file "Bank-issued file (PDF, JPEG or PNG; up to 5 MiB)", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
    fill_in "Document note / correction reason", with: "Synthetic retained upload note"
    press "Save bank document"
    Timeout.timeout(10) { waiting.pop }
    expect(page).to have_button("Saving evidence…", disabled: true)
    expect(page).to have_select("Bank document type", disabled: true)
    expect(page).to have_field("Bank-issued file (PDF, JPEG or PNG; up to 5 MiB)", disabled: true)
    expect(page).to have_field("Document note / correction reason", disabled: true)
    fail_upload = false
    release << true
    expect(page).to have_css("[role='alert']", text: "Synthetic upload failure")
    expect(page).to have_select("Bank document type", selected: "FIRC", disabled: false)
    expect(page).to have_field("Document note / correction reason", with: "Synthetic retained upload note", disabled: false)
    expect(find_field("Bank-issued file (PDF, JPEG or PNG; up to 5 MiB)").value).to end_with("pdf-file.pdf")
    first = Timeout.timeout(10) { commands.pop }
    press "Save bank document"
    expect(page).to have_text("Bank document received.")
    expect(Timeout.timeout(10) { commands.pop }).to eq(first)
    expect(PayrollRemittanceDocument.count).to eq(1)
    expect(page).to have_field("Document note / correction reason", with: "")
    expect(find_field("Bank-issued file (PDF, JPEG or PNG; up to 5 MiB)").value).to eq("")
  ensure
    release << true if release
  end

  [1440, 375].each do |width|
    it "uploads before invoice, retains a correction and downloads exact private bytes at #{width}px" do
      sign_in worker
      page.current_window.resize_to(width, 1000)
      visit "/settings/consultant-invoices"
      expect(page).to have_text("Missing bank document — follow up")
      expect(page).to have_text("Payment: Credited")
      expect(page).to have_text("Invoice not issued yet")
      upload_evidence("Synthetic bank-issued FIRC declaration")
      first = PayrollRemittanceDocument.sole
      upload_evidence("Synthetic corrected bank document")
      expect(PayrollRemittanceDocument.count).to eq(2)
      expect(page).to have_text("earlier evidence retained")
      expect(leg.reload.credit_state).to eq("credited")
      Dir.mktmpdir("synthetic-remittance-download") do |directory|
        downloads = page.driver.browser.downloads
        downloads.set_behavior(save_path: directory)
        expect(downloads.wait(10) { press "Download FIRC ##{first.id}" }).to be(true)
        file = Dir[File.join(directory, "*.pdf")].sole
        expect(Digest::SHA256.file(file).hexdigest).to eq(first.details.dig("file", "sha256"))
      end
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
      if ENV["REMITTANCE_SHOTS"]
        FileUtils.mkdir_p(ENV.fetch("REMITTANCE_SHOTS"))
        page.save_screenshot(File.join(ENV.fetch("REMITTANCE_SHOTS"), "remittance-history-#{width}.png"), full: true)
      end
    end
  end

  it "discovers the same evidence from its issued invoice and loses accounts access immediately" do
    upload = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    file = ActionDispatch::Http::UploadedFile.new(tempfile: upload.tempfile, filename: "synthetic-advice.pdf", type: "application/pdf")
    Payroll::RemittanceDocuments.new(leg, actor: worker).record!(kind: "inward_remittance_advice", reason: "Synthetic advice before invoice",
      expected_document_id: "", idempotency_key: "system-advice", file:)
    prepare_consultant_invoice
    grant_invoice_consent
    # PDF rendering is independently covered; this UI case needs only an issued
    # document identity and the real retained remittance bytes.
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_return(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")))
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    sign_in accounts
    visit "/payroll/#{run.id}/consultant-invoices"
    expect(page).to have_text("Linked paid invoice ##{invoice.id}.")
    expect(page).to have_text("Synthetic advice before invoice")
    accounts.remove_role(:book_keeper, company)
    press "Refresh invoice status"
    expect(page).to have_css("[role='alert']")
    expect(page).to have_no_text("Synthetic advice before invoice")
    expect(page).to have_no_button("Save bank document")
  end

  context "with two submitted split legs" do
    let(:leg) { split_legs.first }
    let(:split_legs) do
      revision
      arrangements = Payroll::SplitArrangements.new(run)
      spouse = bank_details.merge("bank_account_name" => "Synthetic Spouse", "bank_account_number" => "222233334444")
      arrangement = arrangements.request!(actor: accounts, employment_id: employment.id,
        attributes: { allocation_kind: "percentage", allocation_value: "25", allocated_to: "spouse", remainder_to: "consultant" },
        details: spouse, account_number_confirmation: spouse.fetch("bank_account_number"))
      arrangements.verify!(actor: accounts, arrangement_id: arrangement.id)
      arrangements.approve!(actor: owner, arrangement_id: arrangement.id)
      verified_connection
      linked_recipient
      spouse_id = "66666666-6666-4666-8666-666666666666"
      stub_request(:get, "#{mercury_base}/recipient/#{spouse_id}").to_return(mercury_json(mercury_recipient("id" => spouse_id, "name" => "Synthetic Spouse",
        "internationalWireRoutingInfo" => { "iban" => "222233334444", "swiftCode" => bank_details.fetch("bank_swift"), "countrySpecific" => { "india" => { "ifscCode" => bank_details.fetch("bank_ifsc") } } })))
      linked_recipient(beneficiary: "spouse", id: spouse_id)
      legs = Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      legs.each do |instruction|
        stub_mercury_write(mercury_json(mercury_request("requestId" => SecureRandom.uuid, "recipientId" => instruction.mercury_recipient_id,
          "amount" => instruction.principal_minor / 100.0, "status" => "approved")))
        Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
      end
      legs.each(&:reload)
    end

    [false, true].each do |pending|
      it "retains the sibling's #{pending ? 'pending upload' : 'unsaved file and note'} while another leg refreshes history" do
        sibling = split_legs.last
        index_waiting, index_release, upload_waiting, upload_release = Queue.new, Queue.new, Queue.new, Queue.new
        hold_index = false
        hold_upload = pending
        allow_any_instance_of(Api::V1::RemittanceDocumentsController).to receive(:index).and_wrap_original do |method|
          if hold_index
            index_waiting << true
            Timeout.timeout(30) { index_release.pop }
          end
          method.call
        end
        allow_any_instance_of(Api::V1::RemittanceDocumentsController).to receive(:create).and_wrap_original do |method|
          if hold_upload && method.receiver.params[:payment_instruction_id] == sibling.id.to_s
            upload_waiting << true
            Timeout.timeout(30) { upload_release.pop }
          end
          method.call
        end
        sign_in worker
        visit "/settings/consultant-invoices"
        first_row = find("article[aria-label='consultant remittance #{leg.id}']")
        sibling_row = find("article[aria-label='spouse remittance #{sibling.id}']")
        within(first_row) do
          expect(page).to have_text("No bank document uploaded yet.")
          expect(page).to have_no_text("Missing bank document — follow up")
          expect(page).to have_no_text("Bank document received.")
        end
        within(sibling_row) do
          attach_file "Bank-issued file (PDF, JPEG or PNG; up to 5 MiB)", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
          fill_in "Document note / correction reason", with: "Synthetic sibling private draft"
          press "Save bank document" if pending
        end
        Timeout.timeout(10) { upload_waiting.pop } if pending
        hold_index = true
        within(first_row) do
          attach_file "Bank-issued file (PDF, JPEG or PNG; up to 5 MiB)", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
          fill_in "Document note / correction reason", with: "Synthetic first-leg evidence"
          press "Save bank document"
        end
        Timeout.timeout(10) { index_waiting.pop }
        within(sibling_row) do
          expect(find_field("Document note / correction reason", disabled: pending).value).to eq("Synthetic sibling private draft")
          expect(find_field("Bank-issued file (PDF, JPEG or PNG; up to 5 MiB)", disabled: pending).value).to end_with("pdf-file.pdf")
          expect(page).to have_select("Bank document type", disabled: pending)
          expect(page).to have_button(pending ? "Saving evidence…" : "Save bank document", disabled: pending)
        end
        within(first_row) { expect(find_field("Document note / correction reason").value).to eq("") }
        hold_index = false
        index_release << true
        expect(page).to have_no_text("Loading private remittance history…")
        within(sibling_row) do
          expect(find_field("Document note / correction reason", disabled: pending).value).to eq("Synthetic sibling private draft")
          expect(find_field("Bank-issued file (PDF, JPEG or PNG; up to 5 MiB)", disabled: pending).value).to end_with("pdf-file.pdf")
        end
        if pending
          hold_upload = false
          upload_release << true
          within(sibling_row) do
            expect(page).to have_text("Bank document received.")
            expect(find_field("Document note / correction reason").value).to eq("")
          end
          expect(PayrollRemittanceDocument.count).to eq(2)
        end
        worker.update!(current_workspace: create(:company))
        press "Refresh remittance history"
        expect(page).to have_text("Remittance workspace changed")
        expect(page).to have_no_text("Synthetic first-leg evidence")
        expect(page).to have_no_field("Document note / correction reason")
      ensure
        index_release << true if index_release
        upload_release << true if upload_release
      end
    end
  end

  context "with an uncertain submission retaining its request ID" do
    let(:leg) do
      revision
      verified_connection
      linked_recipient
      instruction = Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id,
        expected_digest: revision.digest, quote:).sole
      stub_mercury_write(mercury_json(mercury_request("amount" => 1.00)))
      Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
    end

    it "keeps reconciliation available without requesting an accepted transfer's documents" do
      expect(leg.submission_state).to eq("uncertain")
      expect(leg.provider_request_id).to be_present
      sign_in owner
      visit "/payroll/#{run.id}"
      expect(page).to have_text("Mercury payments")
      expect(page).to have_text("Outcome unknown. Reconcile before anything else")
      expect(page).to have_no_css("section[aria-label='Bank remittance documents']")
    end
  end
end
