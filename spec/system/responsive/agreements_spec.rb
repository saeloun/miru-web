# frozen_string_literal: true

require "rails_helper"
require "tmpdir"

RSpec.describe "Agreement authoring", type: :system, js: true do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:master) do
    AgreementTemplate.create!(company:, created_by: admin, title: "Synthetic consultant master", kind: "consultant",
      document: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Original clause नमस्कार" }] }] }, fields: [])
  end

  before { admin.add_role(:admin, company) }

  around do |example|
    controllers = [Api::V1::AgreementTemplatesController, Api::V1::AgreementsController]
    original = controllers.map(&:allow_forgery_protection)
    controllers.each { |controller| controller.allow_forgery_protection = true }
    with_forgery_protection { example.run }
  ensure
    controllers.zip(original).each { |controller, value| controller.allow_forgery_protection = value }
  end

  def open_agreements(path = "/agreements")
    sign_in(admin)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    visit path
  end

  def body_editor
    find('[contenteditable="true"][aria-label="Contract body"]')
  end

  def expect_saved
    expect(page).to have_css('[role="status"]', text: "All changes saved")
  end

  def choose_field(label: "Legal name", key: "legal_name", type: "text", role: "counterparty")
    click_button "Add field"
    within('[role="dialog"]') do
      fill_in "Field key", with: key
      fill_in "Field label", with: label
      select type.capitalize, from: "Field type"
      select({ "admin" => "Administrator", "counterparty" => "Counterparty", "company_signer" => "Company signer" }.fetch(role), from: "Assigned to")
      check "Required"
      fill_in "Dropdown options", with: "INR\nUSD" if type == "dropdown"
      click_button "Save field"
    end
  end

  it "creates and reopens a formatted master with configurable fields on desktop and mobile" do
    with_forgery_protection do
      open_agreements
      expect(page).to have_css("h1", text: "Agreements")
      click_button "New template"
      within('[role="dialog"]') do
        fill_in "Template title", with: "Synthetic client master"
        select "Client", from: "Agreement kind"
        click_button "Create template"
      end
      expect(page).to have_field("Document title", with: "Synthetic client master")
      body_editor.click
      page.driver.browser.page.command("Input.insertText", text: "Independent clause नमस्कार")
      click_button "Bold"
      body_editor.send_keys(" Bold clause")
      choose_field
      click_button "Insert Legal name"
      click_button "Insert table"
      expect(page).to have_css('[contenteditable="true"] table')
      click_button "Page break"
      expect(page).to have_css("[data-page-break]")
      expect_saved
      record = AgreementTemplate.find_by!(title: "Synthetic client master")
      expect(record.fields).to include(hash_including("key" => "legal_name", "role" => "counterparty", "required" => true))
      expect(record.document.to_json).to include("Independent clause", "mergeField", "table", "pageBreak", "bold")
      visit current_path
      expect(page).to have_content("Independent clause नमस्कार")
      expect(page).to have_button("Insert Legal name")
      click_button "Remove Legal name"
      within('[role="dialog"]') { click_button "Remove field and placements" }
      expect(page).not_to have_button("Insert Legal name")
      click_button "Undo"
      expect(page).to have_button("Insert Legal name")
      expect_saved
      expect(record.reload.fields).to include(hash_including("key" => "legal_name"))
      [320, 375, 1440].each do |width|
        page.current_window.resize_to(width, 900)
        expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
      end
      page.current_window.resize_to(375, 900)
      click_button "Fields (1)"
      within('[role="dialog"]') { expect(page).to have_button("Edit Legal name") }
      expect(@console_errors).to be_empty
    end
  end

  it "previews Word import before replacement and keeps existing content after an unsupported upload" do
    open_agreements("/agreements/templates/#{master.id}")
    expect(page).to have_content("Original clause नमस्कार")
    attach_file "Import Word document", Rails.root.join("spec/fixtures/agreements/synthetic-short.docx")
    within('[role="dialog"]') do
      expect(page).to have_content("Preview Word import")
      expect(page).to have_content("SYNTHETIC TEST ONLY")
      click_button "Cancel import"
    end
    expect(page).to have_content("Original clause नमस्कार")
    attach_file "Import Word document", Rails.root.join("spec/fixtures/agreements/synthetic-short.docx")
    within('[role="dialog"]') { click_button "Replace body and fields" }
    expect_saved
    expect(master.reload.fields.size).to eq(4)
    imported = master.document.deep_dup
    attach_file "Import Word document", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
    expect(page).to have_css('[role="alert"]', text: /DOCX|docx/)
    expect(master.reload.document).to eq(imported)
    expect(@console_errors).to be_empty
  end

  it "generates a consultant copy, fills typed fields and exports the persisted draft without changing the master" do
    consultant = create(:employment, company:, resigned_at: nil, employment_type: "Consultant")
    consultant.user.update!(first_name: "Synthetic", last_name: "Consultant")
    open_agreements("/agreements/templates/#{master.id}")
    choose_field(label: "Payment currency", key: "payment_currency", type: "dropdown", role: "admin")
    click_button "Edit Payment currency"
    within('[role="dialog"]') do
      fill_in "Dropdown options", with: "INR\nUSD"
      click_button "Save field"
    end
    click_button "Insert Payment currency"
    expect_saved
    click_link "All agreements"
    within("article", text: master.title) { click_button "Generate draft" }
    within('[role="dialog"]') do
      fill_in "Find counterparty", with: "Synthetic Consultant"
      choose "Synthetic Consultant"
      click_button "Generate draft"
    end
    expect(page).to have_content(/Draft agreement/i)
    select "USD", from: "Value: Payment currency"
    body_editor.click
    body_editor.send_keys(:end, :enter, "Independent copy clause")
    expect(page).to have_content("Independent copy clause")
    expect_saved
    draft = Agreement.find_by!(agreement_template: master)
    expect(draft.field_values).to include("payment_currency" => "USD")
    expect(draft.document.to_json).to include("Independent copy clause")
    expect(master.reload.document.to_json).not_to include("Independent copy clause")
    allow(Ferrum::Browser).to receive(:new).and_call_original
    Dir.mktmpdir("agreement-download") do |directory|
      page.driver.browser.downloads.set_behavior(save_path: directory)
      expect(page.driver.browser.downloads.wait(10) { click_button "Download draft PDF" }).to be(true)
      pdf = File.binread(File.join(directory, "agreement-#{draft.id}-draft.pdf"))
      expect(pdf).to start_with("%PDF-")
      expect(pdf).to include("%%EOF")
    end
    expect(@console_errors).to be_empty
  end

  it "retains local edits after a concurrent save and guards navigation before discarding them" do
    open_agreements("/agreements/templates/#{master.id}")
    expect(page).to have_content("Original clause")
    using_session(:concurrent_editor) do
      visit "/login"
      wait_for_react_app
      type_login_field("email", admin.email)
      type_login_field("password", SessionHelpers::SYSTEM_TEST_PASSWORD)
      click_button "Sign in"
      expect(page).to have_current_path("/dashboard")
      visit "/agreements/templates/#{master.id}"
      fill_in "Document title", with: "Concurrent title"
      expect_saved
    end
    body_editor.send_keys(" Local recovery clause")
    expect(page).to have_css('[role="alert"]', text: /changed/)
    expect(page).to have_content("Local recovery clause")
    expect(master.reload.document.to_json).not_to include("Local recovery clause")
    expect(page).to have_button("Download recovery copy")
    click_link "All agreements"
    within('[role="dialog"]') do
      expect(page).to have_content("Unsaved changes")
      click_button "Keep editing"
    end
    expect(page).to have_content("Local recovery clause")
    click_button "Reload saved version"
    within('[role="dialog"]') { click_button "Discard local edits and reload" }
    expect(page).to have_field("Document title", with: "Concurrent title")
    expect(page).not_to have_content("Local recovery clause")
    expect(@console_errors).to be_empty
  end

  it "keeps newer edits dirty when a previous save is in flight and recovers from a failed request" do
    open_agreements("/agreements/templates/#{master.id}")
    expect(page).to have_content("Original clause")
    page.execute_script(<<~JS)
      const send = XMLHttpRequest.prototype.send;
      let failed = false;
      XMLHttpRequest.prototype.send = function(body) {
        if (typeof body === "string" && body.includes('"agreement_template"')) {
          if (!failed) {
            failed = true;
            this.abort();
            this.dispatchEvent(new ProgressEvent("error"));
            return;
          }
          setTimeout(() => send.call(this, body), 900);
        } else send.call(this, body);
      };
    JS
    body_editor.send_keys(" First local edit")
    expect(page).to have_css('[role="alert"]', text: /save|network/i)
    expect(page).to have_content("First local edit")
    click_button "Save now"
    expect(page).to have_css('[role="status"]', text: "Saving")
    body_editor.click
    body_editor.send_keys(:end, " Newer local edit")
    expect(page).to have_content("Newer local edit")
    expect_saved
    expect(master.reload.document.to_json).to include("First local edit", "Newer local edit")
    expect(@console_errors).to be_empty
  end

  it "does not expose confidential authoring to staff" do
    admin.remove_role(:admin, company)
    admin.add_role(:employee, company)
    open_agreements
    expect(page).not_to have_button("New template")
    expect(page).not_to have_link("Agreements", href: "/agreements")
    expect(@console_errors).to be_empty
  end

  it "blocks workspace changes before they mutate the session while local edits need recovery" do
    other = create(:company, name: "Other synthetic workspace")
    create(:employment, company: other, user: admin, resigned_at: nil)
    admin.add_role(:admin, other)
    open_agreements("/agreements/templates/#{master.id}")
    expect(page).to have_content("Original clause")
    master.update!(title: "Concurrent update")
    body_editor.send_keys(" Recover before switching")
    expect(page).to have_css('[role="alert"]', text: /changed/)
    click_button admin.full_name
    click_button "Other synthetic workspace"
    expect(page).to have_content("Save your edits or leave the editor before changing workspaces.")
    expect(admin.reload.current_workspace_id).to eq(company.id)
    click_button "Keep editing"
    expect(page).to have_content("Recover before switching")
    click_link "All agreements"
    within('[role="dialog"]') { click_button "Discard edits and leave" }
    expect(page).to have_button("New template")
    click_button admin.full_name
    click_button "Other synthetic workspace"
    expect(page).to have_content("No templates yet")
    expect(admin.reload.current_workspace_id).to eq(other.id)
    expect(@console_errors).to be_empty
  end

  it "prefills a client identity preset and keeps required signature fields unfillable in a draft" do
    client = create(:client, company:, name: "Synthetic client", legal_name: "आनंद & Partners Private Limited")
    template = AgreementTemplate.create!(company:, created_by: admin, title: "Synthetic client signing placeholders",
      kind: "client", document: master.document, fields: [])
    open_agreements("/agreements/templates/#{template.id}")
    click_button "Add field"
    within('[role="dialog"]') do
      select "Legal name", from: "Start from field"
      expect(page).to have_field("Field key", with: "legal_name")
      check "Required"
      check "Read-only for recipient"
      click_button "Save field"
    end
    click_button "Insert Legal name"
    choose_field(label: "Company signature", key: "company_signature", type: "signature", role: "company_signer")
    click_button "Insert Company signature"
    expect_saved
    click_link "All agreements"
    within("article", text: template.title) { click_button "Generate draft" }
    within('[role="dialog"]') do
      fill_in "Find counterparty", with: client.legal_name
      choose client.legal_name
      click_button "Generate draft"
    end
    expect(page).to have_field("Value: Legal name", with: client.legal_name)
    expect(page).to have_content("Read-only for the future recipient")
    find('button[aria-controls="field-panel-company_signature"]').click
    expect(page).to have_content("Reserved for signing. Draft editing cannot create a signature.")
    expect(page).not_to have_field("Value: Company signature")
    expect(page).to have_css('[role="status"]', text: "1 required fields missing")
    draft = Agreement.find_by!(agreement_template: template)
    expect(draft.field_values).to include("legal_name" => client.legal_name)
    expect(draft.field_values["company_signature"]).to be_nil
    expect(@console_errors).to be_empty
  end

  it "edits fields in a long contract on mobile and measures its real draft download" do
    preview = File.open(Rails.root.join("spec/fixtures/agreements/synthetic-long.docx"), "rb") do |file|
      upload = ActionDispatch::Http::UploadedFile.new(tempfile: file, filename: "synthetic-long.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      Agreements::DocxImport.new(upload).process
    end
    template = AgreementTemplate.create!(company:, created_by: admin, title: "Synthetic long measurement", kind: "client",
      document: preview[:document], fields: preview[:fields])
    client = create(:client, company:, name: "Synthetic measurement client")
    open_agreements("/agreements/templates/#{template.id}")
    expect(page).to have_css("[data-merge-field]", count: 60)
    page.current_window.resize_to(375, 1000)
    expect(page.evaluate_script("window.innerWidth")).to eq(375)
    started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    click_button "Fields (60)"
    within('[role="dialog"]') { expect(page).to have_button("Edit Field 0") }
    opened_ms = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started) * 1000
    started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    click_button "Edit Field 0"
    within('[role="dialog"]', text: "Edit field") do
      expect(page).to have_field("Field label", with: "Field 0")
      settings_ms = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started) * 1000
      fill_in "Field label", with: "Legal entity"
      select "Counterparty", from: "Assigned to"
      check "Read-only for recipient"
      page.save_screenshot(Rails.root.join("tmp/capybara/agreement-long-mobile-field-settings.png"), full: false)
      click_button "Save field"
      @settings_ms = settings_ms
    end
    expect(page).not_to have_field("Field label")
    within('[role="dialog"]') { click_button "Close" }
    expect_saved
    click_link "All agreements"
    within("article", text: template.title) { click_button "Generate draft" }
    within('[role="dialog"]') do
      fill_in "Find counterparty", with: client.name
      choose client.name
      click_button "Generate draft"
    end
    click_button "Fields (60)"
    fill_in "Value: Legal entity", with: "आनंद & Núñez Private Limited"
    within('[role="dialog"]') { click_button "Close" }
    expect_saved
    draft = Agreement.find_by!(agreement_template: template)
    expect(draft.reload.field_values).to include("field_0" => "आनंद & Núñez Private Limited")
    expect(page.evaluate_script("document.getElementById('document-title').getBoundingClientRect().width")).to be >= 250
    expect(page).to have_css("[data-merge-field]", count: 60)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    page.save_screenshot(Rails.root.join("tmp/capybara/agreement-long-mobile-draft.png"), full: false)
    allow(Ferrum::Browser).to receive(:new).and_call_original
    started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    Dir.mktmpdir("long-agreement-download") do |directory|
      page.driver.browser.downloads.set_behavior(save_path: directory)
      expect(page.driver.browser.downloads.wait(15) { click_button "Download draft PDF" }).to be(true)
      pdf = File.binread(File.join(directory, "agreement-#{draft.id}-draft.pdf"))
      expect(pdf).to start_with("%PDF-")
      expect(pdf).to include("%%EOF")
      File.binwrite(Rails.root.join("tmp/capybara/agreement-long-ui-draft.pdf"), pdf)
    end
    download_ms = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started) * 1000
    File.write(Rails.root.join("tmp/capybara/agreement-long-ui-metrics.json"), {
      environment: "headless Brave/Cuprite, arm64 macOS, Ruby4.0.9, isolated Rails test server",
      width: 375, fields: 60, field_dialog_ms: opened_ms, field_settings_ms: @settings_ms, pdf_download_ms: download_ms
    }.to_json)
    expect(@console_errors).to be_empty
  end
end
