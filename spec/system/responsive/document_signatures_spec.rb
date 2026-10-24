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

  def add_signer
    click_button "Add recipient"
    within('fieldset[aria-label="Recipient 1"]') do
      fill_in "Name", with: "Synthetic Consultant"
      fill_in "Email", with: "consultant@example.test"
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
end
