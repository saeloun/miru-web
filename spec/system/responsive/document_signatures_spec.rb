# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Uploaded documents for signing", type: :system, js: true do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:main_pdf) { Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf") }
  let(:addendum) { Rails.root.join("docs/qa/generic-document-signing-2462/qa-addendum.pdf") }

  before { admin.add_role(:admin, company) }

  around do |example|
    controller = Api::V1::SignatureRequestsController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    controller.allow_forgery_protection = original if controller
  end

  def open_documents(files: [main_pdf, addendum])
    sign_in(admin)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    visit "/agreements"
    click_button "Upload documents"
    fill_in "Document title", with: "Synthetic uploaded agreement"
    attach_file "PDF documents", files
    click_button "Create signing draft"
    expect(page).to have_current_path(%r{/agreements/documents/\d+})
    expect(page).to have_css('[data-pdf-ready="true"]')
  end

  def add_signer(index: 1, name: "Synthetic Consultant", email: "consultant@example.test")
    click_button "Add recipient"
    within("fieldset[aria-label='Recipient #{index}']") do
      fill_in "Name", with: name
      fill_in "Email", with: email
    end
  end

  it "uploads individual PDFs and saves repeated signature blocks with keyboard placement on mobile" do
    open_documents
    expect(page).not_to have_content("Choose a template")
    add_signer
    click_button "Add field"
    fill_in "Field label", with: "Main agreement signature"
    fill_in "Field page", with: "1"
    click_button "Add field"
    fill_in "Field label", with: "Statement of work signature"
    fill_in "Field page", with: "2"
    fill_in "Left (%)", with: "20"
    find('button[aria-label="Move Statement of work signature"]').send_keys(:right)
    expect(page).to have_field("Left (%)", with: "21")
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    record = SignatureRequest.find_by!(title: "Synthetic uploaded agreement")
    expect(record.current_revision.fields).to contain_exactly(
      hash_including("label" => "Main agreement signature", "page" => 1),
      hash_including("label" => "Statement of work signature", "page" => 2, "x" => 21))
    [375, 1440].each do |width|
      page.current_window.resize_to(width, 900)
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    end
    select "150%", from: "Preview zoom"
    expect(page).to have_css('[data-pdf-ready="true"]')
    visit current_path
    expect(page).to have_css('button[aria-label="Edit Statement of work signature"]')
    expect(@console_errors).to be_empty
  end

  it "retains unsaved input after a stale save and requires confirmation before reloading" do
    open_documents
    record = SignatureRequest.find_by!(title: "Synthetic uploaded agreement")
    record.with_lock { record.revise!(actor: admin, attributes: { title: "Newer server draft" }) }
    fill_in "Document title", with: "Unsaved local negotiations"
    click_link "All documents"
    within('[role="dialog"]') { click_button "Keep editing" }
    expect(page).to have_field("Document title", with: "Unsaved local negotiations")
    click_button "Save changes"
    expect(page).to have_content("Reload it before saving")
    expect(page).to have_field("Document title", with: "Unsaved local negotiations")
    click_button "Reload latest"
    within('[role="dialog"]') { click_button "Keep editing" }
    expect(page).to have_field("Document title", with: "Unsaved local negotiations")
    click_button "Reload latest"
    within('[role="dialog"]') { click_button "Discard and reload" }
    expect(page).to have_field("Document title", with: "Newer server draft")
  end

  it "remaps replacements explicitly and keeps earlier sources and fields in history" do
    open_documents
    add_signer
    click_button "Add field"
    fill_in "Field label", with: "Previous signature block"
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    record = SignatureRequest.find_by!(title: "Synthetic uploaded agreement")
    previous = record.current_revision
    attach_file "Replacement PDFs", addendum
    click_button "Replace sources"
    within('[role="dialog"]') { click_button "Replace and clear fields" }
    expect(page).to have_content("Place fields again on the new source")
    expect(page).not_to have_css('button[aria-label="Edit Previous signature block"]')
    expect(record.reload.current_revision.fields).to be_empty
    expect(previous.reload.fields.first.fetch("label")).to eq("Previous signature block")
    select "Version #{previous.number}", from: "Document version"
    expect(page).to have_content("Historical version")
    expect(page).to have_css('button[aria-label="Edit Previous signature block"]')
    expect(page).not_to have_button("Save changes")
  end

  it "provides supported typed fields and prevents signature prefilling" do
    open_documents
    add_signer
    click_button "Add field"
    expect(page).not_to have_field("Field value")
    expect(page).to have_unchecked_field("Read-only", disabled: true)
    select "Dropdown", from: "Field type"
    fill_in "Dropdown options", with: "INR\nUSD"
    select "INR", from: "Field value"
    check "Read-only"
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    field = SignatureRequest.find_by!(title: "Synthetic uploaded agreement").current_revision.fields.first
    expect(field).to include("type" => "dropdown", "options" => %w[INR USD], "value" => "INR", "read_only" => true)
    expect(@console_errors).to be_empty
  end

  it "keeps long field labels within the mobile viewport" do
    open_documents
    add_signer
    click_button "Add field"
    fill_in "Field label", with: "Long_signature_" * 14
    page.current_window.resize_to(375, 900)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
  end

  it "renders images on cropped rotated pages and retains percentage placement through zoom" do
    open_documents(files: [Rails.root.join("spec/fixtures/files/signature-rendering.pdf")])
    blue_pixels = page.evaluate_script(<<~JS)
      (() => {
        const canvas = document.querySelector('[aria-label="PDF page 1"]');
        const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 80 && pixels[i + 1] < 120 && pixels[i + 2] > 180) count++;
        return count;
      })()
    JS
    expect(blue_pixels).to be > 100
    add_signer
    click_button "Add field"
    fill_in "Left (%)", with: "40"
    select "150%", from: "Preview zoom"
    expect(page).to have_css('[data-pdf-ready="true"]')
    rectangle = page.evaluate_script(<<~JS)
      (() => {
        const page = document.querySelector(".signature-page").getBoundingClientRect();
        const field = document.querySelector(".signature-placement").getBoundingClientRect();
        return { ratio: page.width / page.height, left: (field.left - page.left) / page.width * 100 };
      })()
    JS
    expect(rectangle.fetch("ratio")).to be_within(0.01).of(1.4)
    expect(rectangle.fetch("left")).to be_within(0.01).of(40)
    select "2", from: "Preview page"
    expect(page).to have_css('canvas[aria-label="PDF page 2"]')
    expect(page).to have_css('[data-pdf-ready="true"]')
    expect(@console_errors).to be_empty
  end

  it "drags and resizes fields assigned to different signers and persists their exact positions" do
    open_documents
    add_signer
    add_signer(index: 2, name: "Synthetic Company Signer", email: "company@example.test")
    click_button "Add field"
    fill_in "Field label", with: "Consultant signature"
    click_button "Add field"
    fill_in "Field label", with: "Company signature"
    select "Synthetic Company Signer — company@example.test", from: "Assigned recipient"
    fill_in "Left (%)", with: "20"
    fill_in "Top (%)", with: "30"
    find('button[aria-label="Move Company signature"]').native.drag_by(40, 30, steps: 5, scroll: false)
    left = find_field("Left (%)").value.to_f
    expect(left).to be > 20
    find('button[aria-label="Resize Company signature"]').native.drag_by(40, 20, steps: 5, scroll: false)
    expect(page).not_to have_field("Width (%)", with: "30")
    width = find_field("Width (%)").value.to_f
    expect(width).to be > 30
    expect(find_field("Height (%)").value.to_f).to be > 8
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    revision = SignatureRequest.find_by!(title: "Synthetic uploaded agreement").current_revision
    company_signer = revision.recipients.find { |recipient| recipient.fetch("email") == "company@example.test" }
    expect(revision.fields.find { |field| field.fetch("label") == "Company signature" })
      .to include("recipient_id" => company_signer.fetch("id"), "x" => left, "width" => width)
    page.execute_script("window.scrollTo(0,0)")
    page.save_screenshot(Rails.root.join("tmp/capybara/signature-placement-desktop.png"), full: true)
    page.current_window.resize_to(375, 900)
    page.document.synchronize(Capybara.default_max_wait_time) do
      usable_width = page.evaluate_script(<<~JS)
        (() => {
          const box = document.querySelector(".signature-workspace").getBoundingClientRect();
          return box.left <= 40 && box.width >= window.innerWidth - 80;
        })()
      JS
      raise Capybara::ExpectationNotMet, "The mobile workspace did not reach a usable width" unless usable_width
    end
    expect(page).to have_css('[data-pdf-ready="true"]')
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    page.execute_script("window.scrollTo(0,0)")
    page.save_screenshot(Rails.root.join("tmp/capybara/signature-placement-mobile.png"), full: false)
    expect(@console_errors).to be_empty
  end

  it "retains the upload form after a malformed PDF and recovers with an actual document" do
    sign_in(admin)
    visit "/agreements"
    click_button "Upload documents"
    fill_in "Document title", with: "Retained upload title"
    Tempfile.create(["invalid-signing", ".pdf"]) do |file|
      file.write("Synthetic invalid PDF"); file.flush
      attach_file "PDF documents", file.path
      click_button "Create signing draft"
      expect(page).to have_content("flat, unlocked PDF")
      expect(page).to have_field("Document title", with: "Retained upload title")
      expect(SignatureRequest.count).to eq(0)
      page.save_screenshot(Rails.root.join("tmp/capybara/signature-upload-recovery.png"), full: true)
      attach_file "PDF documents", main_pdf
      click_button "Create signing draft"
      expect(page).to have_current_path(%r{/agreements/documents/\d+})
      expect(page).to have_css('[data-pdf-ready="true"]')
    end
  end

  it "blocks workspace changes without losing an uploaded draft's unsaved edits" do
    other = create(:company, name: "Other signing workspace")
    create(:employment, company: other, user: admin, resigned_at: nil)
    admin.add_role(:admin, other)
    open_documents
    fill_in "Document title", with: "Unsaved private negotiations"
    click_button admin.full_name
    click_button "Other signing workspace"
    expect(page).to have_content("Save your edits or leave the editor before changing workspaces.")
    expect(admin.reload.current_workspace_id).to eq(company.id)
    expect(page).to have_field("Document title", with: "Unsaved private negotiations")
    expect(SignatureRequest.last.title).to eq("Synthetic uploaded agreement")
  end
end
