# frozen_string_literal: true

require "rails_helper"
require "tmpdir"
require "timeout"

RSpec.describe "Private consultant paid invoices", type: :system, js: true do
  self.use_transactional_tests = false
  include_context "committed consultant invoice"
  let(:console_errors) { [] }
  around { |example| with_forgery_protection { example.run } }
  before do
    worker.update!(first_name: "Synthetic", last_name: "Consultant", current_workspace: company)
    worker.add_role(:employee, company)
    # PDF rendering has separate real-browser/parser coverage. These UI cases
    # store a real synthetic fixture to verify exact authenticated downloads.
    paid_fixture = File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")) + "\n% Synthetic paid document UI fixture\n"
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_return(paid_fixture)
  end
  after { expect(console_errors).to eq([]) }

  def sign_in(actor)
    super
    # sign_in resets Cuprite's page, so bind each new page before its feature
    # navigation, including the admin and live-workspace cases.
    browser_page = page.driver.browser.page
    return if @invoice_console_page.equal?(browser_page)
    @invoice_console_page = browser_page
    browser_page.on("Runtime.consoleAPICalled") { |event| console_errors << event if event["type"] == "error" }
    browser_page.on("Runtime.exceptionThrown") { |event| console_errors << event }
  end

  def open_invoices(actor, width)
    sign_in actor
    @width = width
    page.current_window.resize_to(width, 1000)
    visit "/payroll/#{run.id}/consultant-invoices"
    expect(page).to have_css("h2", text: "Consultant invoices", exact_text: true)
    expect(page).to have_text("Synthetic Consultant")
  end

  def press(text)
    button = find_button(text, exact: true)
    page.scroll_to(button, align: :center)
    button.click
  end

  def complete_facts(existing: false)
    select(existing ? "Link an existing invoice" : "Generate in Miru", from: "Invoice choice")
    fill_in "Billed entity postal address", with: "1 Fictional Street, US"
    fill_in "Billed entity country code", with: "US"
    fill_in "Tax identifier review / not-applicable reason", with: "Synthetic not applicable"
    fill_in "Reviewed document treatment and timing reason", with: "Synthetic non-statutory reviewed timing"
    if existing
      expect(page).to have_no_field("Reviewed issuer series")
      expect(page).to have_no_text("Original issuer series / namespace")
      fill_in "Original invoice number, exactly as shown", with: "INV-2026-0042"
      fill_in "Original invoice date", with: "2026-11-30"
      attach_file "Existing original PDF (up to 5 MiB)", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
    else
      fill_in "Reviewed issuer series", with: "SYN"
      fill_in "Reviewed invoice number within series", with: "1"
    end
    check "I checked whether an invoice already exists and selected the correct document choice."
  end

  def capture(name)
    return unless ENV["INVOICE_SHOTS"]
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    directory = Rails.root.join(ENV.fetch("INVOICE_SHOTS"))
    FileUtils.mkdir_p(directory)
    area = page.evaluate_script("({x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight})")
    page.save_screenshot(directory.join("#{name}-#{@width}.png"), area:)
  end

  def download_exact(label, expected)
    Dir.mktmpdir("consultant-invoice-download") do |directory|
      downloads = page.driver.browser.downloads
      downloads.set_behavior(save_path: directory)
      expect(downloads.wait(10) { press label }).to be(true)
      file = Dir[File.join(directory, "*.pdf")].sole
      expect(Digest::SHA256.file(file).hexdigest).to eq(Digest::SHA256.hexdigest(expected))
      if ENV["INVOICE_SHOTS"]
        evidence = { synthetic: true, label:, width: @width, bytes: File.size(file), sha256: Digest::SHA256.file(file).hexdigest,
          expected_sha256: Digest::SHA256.hexdigest(expected), matched: true, example: RSpec.current_example.full_description }
        output = Rails.root.join(ENV.fetch("INVOICE_SHOTS"), "native-download-#{SecureRandom.hex(8)}.json")
        File.write(output, JSON.pretty_generate(evidence) + "\n")
      end
    end
  end

  [1440, 375].each do |width|
    it "reviews generation explicitly, waits for all credit, and retains own exact download at #{width}px" do
      revision
      grant_invoice_consent
      open_invoices(accounts, width)
      expect(find_field("Invoice choice").value).to eq("")
      complete_facts
      expect(page).to have_button("Review preparation", disabled: true)
      capture("generation-unconfirmed")
      check "I reviewed and confirm this fixed accounts destination for this invoice."
      press "Review preparation"
      expect(page).to have_text("Accounts reviewed")
      expect(PayrollInvoicePreparation.sole.facts.fetch("accounts_email")).to eq("accounts@saeloun.com")
      expect(Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!).to be_a(PayrollInvoicePreparation)
      expect(PayrollConsultantInvoice.count).to eq(0)
      credited_invoice_leg
      invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
      press "Refresh invoice status"
      expect(page).to have_css("h3", text: "SYN/1", exact_text: true)
      capture("generated-paid")
      download_exact("Download paid invoice", invoice.pdf_blob.download)
      sign_in worker
      @width = width
      page.current_window.resize_to(width, 1000)
      visit "/settings/profile"
      link = find_link("My consultant invoices", href: "/settings/consultant-invoices", match: :first)
      page.scroll_to(link, align: :center)
      link.click
      expect(page).to have_css("h1", text: "My consultant invoices", exact_text: true)
      expect(page).to have_css("h3", text: "SYN/1", exact_text: true)
      download_exact("Download paid invoice", invoice.pdf_blob.download)
    end

    it "links an exact existing original and shows its distinct paid statement date at #{width}px" do
      revision
      credited_invoice_leg
      open_invoices(accounts, width)
      complete_facts(existing: true)
      check "I reviewed and confirm this fixed accounts destination for this invoice."
      press "Review preparation"
      expect(page).to have_text("Accounts reviewed")
      preparation = PayrollInvoicePreparation.sole
      original = File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf"))
      expect(preparation.original_blob.download).to eq(original)
      expect(preparation.facts.fetch("series")).to eq("")
      invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
      expect(invoice.pdf_blob.download).not_to eq(original)
      press "Refresh invoice status"
      expect(page).to have_css("h3", text: "INV-2026-0042", exact_text: true)
      expect(page).to have_text("Original invoice date: 2026-11-30 · Statement generated: 2026-12-05")
      capture("linked-paid-statement")
      download_exact("Download original invoice", original)
      download_exact("Download paid statement", invoice.pdf_blob.download)
      expect(PayrollConsultantInvoice.count).to eq(1)
    end
  end

  context "with registered GST billing facts" do
    let(:billing_identity_ready) { false }
    before { review_synthetic_billing_identity(employment:, reviewer: owner, gst_scheme: "regular") }

    it "disables unsupported generation and links/downloads the exact original instead" do
      revision
      credited_invoice_leg
      open_invoices(accounts, 375)
      expect(find_field("Invoice choice").value).to eq("")
      expect(find("option", text: "Generate in Miru", exact_text: true, visible: :all)).to be_disabled
      expect(page).to have_text("Registered or unresolved GST status requires an existing invoice and manual document review.")
      capture("registered-generation-unavailable")
      complete_facts(existing: true)
      check "I reviewed and confirm this fixed accounts destination for this invoice."
      press "Review preparation"
      expect(page).to have_text("Accounts reviewed")
      invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
      expect(invoice).to be_a(PayrollConsultantInvoice)
      expect(invoice.mode).to eq("existing")
      press "Refresh invoice status"
      expect(page).to have_css("h3", text: "INV-2026-0042", exact_text: true)
      capture("registered-linked-statement")
      download_exact("Download original invoice", File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")))
      download_exact("Download paid statement", invoice.pdf_blob.download)
    end
  end

  it "lets an unassigned admin discover an approved period and save facts without review or send authority" do
    revision
    admin = create(:user, current_workspace: company)
    create(:employment, company:, user: admin, joined_at: "2020-01-01", resigned_at: nil)
    admin.add_role(:admin, company)
    sign_in admin
    @width = 1440
    visit "/consultant-payroll"
    click_link "Prepare consultant invoices · 2026-11"
    expect(page).to have_current_path("/payroll/#{run.id}/consultant-invoices")
    complete_facts
    expect(page).to have_no_button("Review preparation")
    press "Save unreviewed preparation"
    expect(page).to have_text("Unreviewed preparation")
    expect(PayrollInvoicePreparation.sole).not_to be_reviewed
    expect(page).to have_no_button("Retry same PDF email")
    capture("admin-unreviewed")
  end

  it "keeps a reopened run's issued document downloadable without exposing draft forms or billing facts" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    draft = workflow.revise!(actor: accounts, payload: revision.payroll_payload.deep_dup, idempotency_key: "browser-issued-run-reopened", expected_digest: revision.digest)
    expect(draft.payroll_approvals.count).to eq(0)
    admin = create(:user, current_workspace: company)
    create(:employment, company:, user: admin, joined_at: "2020-01-01", resigned_at: nil)
    admin.add_role(:admin, company)
    sign_in admin
    @width = 375
    page.current_window.resize_to(375, 1000)
    visit "/consultant-payroll"
    link = find_link("View issued consultant invoices · 2026-11")
    page.scroll_to(link, align: :center)
    link.click
    expect(page).to have_current_path("/payroll/#{run.id}/consultant-invoices")
    expect(page).to have_css("h3", text: "SYN/1", exact_text: true)
    expect(page).to have_no_field("Invoice choice", disabled: :all)
    expect(page).to have_no_text("Approved consultant billing identity")
    expect(page).to have_no_text("AAAPC1234D")
    expect(page).to have_no_button("Review preparation")
    capture("reopened-issued-history")
    download_exact("Download paid invoice", invoice.pdf_blob.download)
  end

  it "keeps stopped-worker evidence separate for two uncertain invoice cards and resets a changed attempt" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    attempt = invoice.payroll_consultant_invoice_deliveries.sole
    attempt.update!(state: "uncertain", error_code: "smtp_outcome_unknown")
    # A read-only second-card fixture isolates client state. It is not a second
    # issued invoice or proof of a second bank settlement.
    second_attempt = "synthetic-second-attempt"
    allow_any_instance_of(Api::V1::PayrollConsultantInvoicesController).to receive(:index).and_wrap_original do |method|
      result = method.call
      body = JSON.parse(method.receiver.response.body)
      row = body.fetch("consultant_invoices").fetch("consultants").sole.deep_dup
      row["employment_id"] = "synthetic-second-consultant"
      row["consultant_name"] = "Synthetic Second Consultant"
      row["invoice"]["id"] = "synthetic-second-invoice"
      row["invoice"]["number"] = "SYN/SECOND"
      row["invoice"]["email"]["id"] = second_attempt
      body.fetch("consultant_invoices").fetch("consultants") << row
      method.receiver.response_body = JSON.generate(body)
      result
    end
    open_invoices(accounts, 1440)
    first = find("article", text: "SYN/1", match: :first)
    second = find("article", text: "SYN/SECOND", match: :first)
    within(first) do
      fill_in "Delivery reconciliation evidence", with: "Synthetic checked mailbox reference"
      check "The previous worker is stopped and its delivery outcome has been checked."
      expect(page).to have_button("Record confirmed non-delivery", disabled: false)
    end
    within(second) do
      expect(find_field("Delivery reconciliation evidence").value).to eq("")
      expect(find_field("The previous worker is stopped and its delivery outcome has been checked.")).not_to be_checked
      expect(page).to have_button("Record confirmed non-delivery", disabled: true)
    end
    capture("uncertain-evidence-isolated")
    second_attempt = "synthetic-replaced-attempt"
    press "Refresh invoice status"
    within(find("article", text: "SYN/SECOND", match: :first)) do
      expect(find_field("Delivery reconciliation evidence").value).to eq("")
      expect(page).to have_button("Record confirmed non-delivery", disabled: true)
    end
    expect(attempt.reload.state).to eq("uncertain")
  end

  it "removes old workspace history before a held new-workspace response and never saves an old download" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    other = create(:company, name: "Synthetic Second Workspace")
    create(:employment, company: other, user: worker, joined_at: "2020-01-01", resigned_at: nil)
    worker.add_role(:employee, other)
    own_waiting, own_release, pdf_waiting, pdf_release = Array.new(4) { Queue.new }
    allow_any_instance_of(Api::V1::ConsultantInvoicesController).to receive(:index).and_wrap_original do |method|
      if method.receiver.send(:current_user).current_workspace_id == other.id
        own_waiting << true
        Timeout.timeout(10) { own_release.pop }
      end
      method.call
    end
    allow_any_instance_of(Api::V1::ConsultantInvoicesController).to receive(:download).and_wrap_original do |method|
      result = method.call
      pdf_waiting << true
      Timeout.timeout(10) { pdf_release.pop }
      result
    end
    sign_in worker
    @width = 1440
    visit "/settings/consultant-invoices"
    expect(page).to have_css("h3", text: "SYN/1", exact_text: true)
    Dir.mktmpdir("old-scope-invoice-download") do |directory|
      page.driver.browser.downloads.set_behavior(save_path: directory)
      press "Download paid invoice"
      Timeout.timeout(10) { pdf_waiting.pop }
      worker.update!(current_workspace: other)
      # Exercise a live provider scope update rather than a reload, which would
      # discard the component and conceal a synchronous stale-data render.
      page.execute_script(<<~JS, other.id, other.name)
        const [id, name] = arguments;
        const root = document.getElementById('react-root');
        const key = Object.keys(root).find(key => key.startsWith('__reactFiber$') || key.startsWith('__reactContainer$'));
        const start = root[key];
        let found;
        function walk(node) {
          if (!node || found) return;
          const state = node.memoizedState?.memoizedState;
          if (state?.authResolution === 'authenticated' && state?.user && state?.company && node.memoizedState?.queue?.dispatch) { found = node; return; }
          walk(node.child); walk(node.sibling);
        }
        walk(start?.stateNode?.current || start);
        if (!found) throw new Error('Live user context was not found');
        window.__invoiceScopeLeaks = [];
        window.__invoiceScopeObserver = new MutationObserver(() => {
          const text = document.body.textContent;
          if (text.includes(name) && text.includes('SYN/1')) window.__invoiceScopeLeaks.push('old invoice');
        });
        window.__invoiceScopeObserver.observe(root, {subtree: true, childList: true, characterData: true});
        const hook = found.memoizedState;
        hook.queue.dispatch(previous => ({ ...previous, user: { ...previous.user, current_workspace_id: id }, company: { ...previous.company, id, name } }));
      JS
      Timeout.timeout(10) { own_waiting.pop }
      expect(page).to have_text("Loading private invoice history…")
      expect(page).to have_no_text("SYN/1")
      expect(page).to have_no_text(invoice.snapshot.fetch("consultant").fetch("pan_number"))
      expect(page.evaluate_script("window.__invoiceScopeLeaks")).to eq([])
      pdf_release << true
      own_release << true
      expect(page).to have_text("No paid consultant invoices are available yet.")
      expect(Dir.children(directory)).to eq([])
      expect(page.evaluate_script("window.__invoiceScopeLeaks")).to eq([])
      page.execute_script("window.__invoiceScopeObserver.disconnect()")
    end
  ensure
    own_release << true if own_release
    pdf_release << true if pdf_release
  end
end
