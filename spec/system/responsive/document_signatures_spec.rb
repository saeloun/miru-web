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
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
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

  it "saves explicit recipient authentication and keeps copy recipients on email links" do
    open_documents
    add_signer
    within("fieldset[aria-label='Recipient 1']") do
      expect(page).to have_select("Signing verification", selected: "Email code at completion")
    end
    click_button "Add field"
    add_signer(index: 2, name: "Synthetic Copy", email: "copy@example.test")
    within("fieldset[aria-label='Recipient 2']") do
      select "Copy recipient", from: "Role"
      expect(page).to have_select("Signing verification", selected: "Email link", disabled: true)
    end
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    record = SignatureRequest.find_by!(title: "Synthetic uploaded agreement")
    expect(record.current_revision.recipients.pluck("authentication")).to eq(%w[email_code email_link])
    refresh
    within("fieldset[aria-label='Recipient 1']") do
      expect(page).to have_select("Signing verification", selected: "Email code at completion")
    end
    [375, 1440].each do |width|
      page.current_window.resize_to(width, 900)
      page.evaluate_async_script("const done = arguments[0]; requestAnimationFrame(() => requestAnimationFrame(done));")
      expect(page).to have_css('[data-pdf-ready="true"]')
      expect(page).not_to have_content("Loading PDF preview…")
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
      page.save_screenshot(Rails.root.join("tmp/capybara/signature-authentication-#{width}.png"), full: false)
    end
    expect(@console_errors).to be_empty
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
      page.document.synchronize(Capybara.default_max_wait_time) do
        handle_size = page.evaluate_script(<<~JS)
          (() => {
            const box = document.querySelector(".signature-resize")?.getBoundingClientRect();
            return box ? [box.width, box.height] : [];
          })()
        JS
        unless handle_size.size == 2 && handle_size.min >= 44
          raise Capybara::ExpectationNotMet, "Resize handle needs a 44px target; observed #{handle_size.inspect}"
        end
      end
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    end
    select "150%", from: "Preview zoom"
    expect(page).to have_css('[data-pdf-ready="true"]')
    visit current_path
    expect(page).to have_css('button[aria-label="Edit Statement of work signature"]')
    expect(@console_errors).to be_empty
  end

  it "handles a cancelled render while its text extraction is still pending" do
    open_documents
    uncaught = []
    page.driver.browser.on("Runtime.exceptionThrown") do |event|
      uncaught << event.dig("exceptionDetails", "exception", "description")
    end
    page.execute_script(<<~JS)
      const originalPost = Worker.prototype.postMessage;
      const originalFrame = window.requestAnimationFrame;
      const originalCancel = window.cancelAnimationFrame;
      const text = [];
      const frames = new Map();
      let frameId = 1000000;
      Worker.prototype.postMessage = function(...args) {
        if (args[0]?.action === "GetTextContent") {
          text.push(() => originalPost.apply(this, args));
          document.documentElement.dataset.pdfHeldText = "true";
        } else originalPost.apply(this, args);
      };
      window.requestAnimationFrame = callback => {
        frames.set(++frameId, callback);
        document.documentElement.dataset.pdfHeldFrame = "true";
        return frameId;
      };
      window.cancelAnimationFrame = id => {
        if (!frames.delete(id)) originalCancel.call(window, id);
      };
      window.restorePdfTiming = () => {
        delete window.restorePdfTiming;
        Worker.prototype.postMessage = originalPost;
        window.requestAnimationFrame = originalFrame;
        window.cancelAnimationFrame = originalCancel;
        text.forEach(send => send());
        frames.forEach(callback => originalFrame.call(window, callback));
      };
    JS
    select "2", from: "Preview page"
    expect(page).to have_css('html[data-pdf-held-text="true"][data-pdf-held-frame="true"]')
    select "1", from: "Preview page"
    page.evaluate_async_script("window.setTimeout(arguments[0], 50)")
    page.execute_script("window.restorePdfTiming()")
    expect(page).to have_css('[data-pdf-ready="true"]')
    expect(uncaught).to be_empty
    expect(@console_errors).to be_empty
  ensure
    page.execute_script("window.restorePdfTiming?.()")
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
    select "Date", from: "Field type"
    expect(find_field("Field value")["aria-describedby"]).to eq("signature-value-help")
    expect(page).to have_css("#signature-value-help", text: "Leave blank to fill automatically")
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

  it "bounds tall PDF preview buffers while retaining zoomed field coordinates" do
    open_documents(files: [Rails.root.join("spec/fixtures/files/signature-tall.pdf")])
    add_signer
    click_button "Add field"
    fill_in "Left (%)", with: "20"
    fill_in "Top (%)", with: "40"
    ["100%", "200%"].each do |zoom|
      select zoom, from: "Preview zoom"
      expect(page).to have_css('[data-pdf-ready="true"]')
      dimensions = page.evaluate_script(<<~JS)
        (() => {
          const canvas = document.querySelector('[aria-label="PDF page 1"]');
          const page = document.querySelector(".signature-page").getBoundingClientRect();
          const field = document.querySelector(".signature-placement").getBoundingClientRect();
          return { width: canvas.width, height: canvas.height, ratio: page.width / page.height,
            left: (field.left - page.left) / page.width * 100, top: (field.top - page.top) / page.height * 100 };
        })()
      JS
      expect(dimensions.fetch("width")).to be_between(1, 4000)
      expect(dimensions.fetch("height")).to be_between(1, 4000)
      expect(dimensions.fetch("ratio")).to be_within(0.0001).of(0.05)
      expect(dimensions.fetch("left")).to be_within(0.01).of(20)
      expect(dimensions.fetch("top")).to be_within(0.01).of(40)
    end
    expect(@console_errors).to be_empty
  end

  it "drags and resizes fields assigned to different signers and persists their exact positions" do
    company.update!(timezone: "Mumbai")
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
    { "Company signature" => 55, "Consultant signature" => 10 }.each do |label, position|
      within("section[aria-label='Document fields']") { click_button label, exact: true }
      fill_in "Left (%)", with: position
      fill_in "Top (%)", with: "59.5"
      fill_in "Width (%)", with: "28.5"
      fill_in "Height (%)", with: "3"
    end
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    expect(page).not_to have_content("Loading PDF preview…")
    expect(page).to have_css(".signature-placement", count: 2)
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
    expect(page).not_to have_content("Loading PDF preview…")
    expect(page).to have_css(".signature-placement", count: 2)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    page.execute_script("window.scrollTo(0,0)")
    page.save_screenshot(Rails.root.join("tmp/capybara/signature-placement-mobile.png"), full: false)
    expect(@console_errors).to be_empty
  end

  it "saves a field at the page edge without a floating-point validation error" do
    open_documents
    add_signer
    click_button "Add field"
    fill_in "Width (%)", with: "8.21"
    fill_in "Left (%)", with: "91.79"
    expect(page.evaluate_script("document.querySelector('#signature-field-x').checkValidity()")).to be(true)
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    field = SignatureRequest.find_by!(title: "Synthetic uploaded agreement").current_revision.fields.first
    expect(field).to include("x" => 91.79, "width" => 8.21)
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

  it "reviews the exact uploaded version privately and records approval before a replacement invalidates it" do
    company.update!(timezone: "Mumbai")
    open_documents
    expect(page).to have_content("Time zone: Asia/Kolkata")
    expect(page).to have_content("Signing window: 3 months")
    add_signer
    click_button "Add field"
    fill_in "Top (%)", with: "59.5"
    fill_in "Width (%)", with: "28.5"
    fill_in "Height (%)", with: "3"
    click_button "Add field"
    select "Text", from: "Field type"
    fill_in "Field label", with: "Reviewed fee"
    fill_in "Field value", with: "INR 12345"
    fill_in "Top (%)", with: "45"
    check "Read-only"
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    click_button "Invite for review"
    expect(page).to have_content("Review invitation queued")
    record = SignatureRequest.find_by!(title: "Synthetic uploaded agreement")
    invitation = record.current_revision.review_invitations.last
    link = "/document-review##{invitation.access_token}"
    visit link
    expect(page).to have_content("Review this document")
    expect(page).to have_content("Time zone: Asia/Kolkata")
    expect(page).to have_content("Email code at completion")
    expect(page).to have_css('[data-pdf-ready="true"]')
    expect(page.evaluate_script("window.location.hash")).to eq("")
    expect(page).to have_content("INR 12345")
    expect(page).to have_css(".signature-placement", text: "INR 12345")
    expect(page).not_to have_content("Loading PDF preview…")
    expect(page).not_to have_field("Field value")
    fill_in "Review comment", with: "<script>window.review_xss = true</script> Please confirm the fee."
    click_button "Request changes"
    expect(page).to have_content("Changes requested")
    expect(page).to have_content("<script>window.review_xss = true</script>")
    expect(page.evaluate_script("window.review_xss === undefined")).to be(true)
    page.save_screenshot(Rails.root.join("tmp/capybara/signature-review-desktop.png"), full: true)
    page.current_window.resize_to(375, 900)
    expect(page).to have_css('[data-pdf-ready="true"]')
    expect(page).not_to have_content("Loading PDF preview…")
    expect(page).to have_css(".signature-placement", count: 2)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    page.save_screenshot(Rails.root.join("tmp/capybara/signature-review-mobile.png"), full: false)
    fill_in "Review comment", with: "Confirmed the fee; this version is approved."
    click_button "Approve this version"
    expect(page).to have_content("Review approved")
    visit "/agreements/documents/#{record.id}"
    expect(page).to have_content("Confirmed the fee")
    select "2", from: "Preview page"
    select "Invited reviews", from: "Approval source"
    check "I confirm this version is approved for signature"
    click_button "Record approval for signing"
    expect(page).to have_content("Approval recorded for this version")
    expect(page).to have_select("Preview page", selected: "2")
    expect(record.reload.current_revision.approval_digest).to eq(record.current_revision.content_digest)
    attach_file "Replacement PDFs", addendum
    click_button "Replace sources"
    within('[role="dialog"]') { click_button "Replace and clear fields" }
    expect(page).to have_content("Place fields again on the new source")
    visit link
    expect(page).to have_content("This review link is unavailable")
    expect(page).not_to have_content("INR 12345")
    expect(@console_errors).to be_empty
  end

  it "renders the local-only review invitation email at desktop and mobile widths" do
    open_documents
    add_signer
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    click_button "Invite for review"
    expect(page).to have_content("Review invitation queued")
    invitation = SignatureReviewInvitation.last
    mail = SignatureReviewMailer.invite(invitation.id).message
    html = mail.html_part.body.decoded
    mail.attachments.each do |attachment|
      next unless attachment.content_id

      cid = attachment.content_id.delete_prefix("<").delete_suffix(">")
      html.gsub!("cid:#{cid}", "data:#{attachment.mime_type};base64,#{Base64.strict_encode64(attachment.body.decoded)}")
    end
    visit "data:text/html;base64,#{Base64.strict_encode64(html)}"
    expect(page).to have_link("Review document")
    expect(page).to have_content("Review approval is not a signature")
    page.save_screenshot(Rails.root.join("tmp/capybara/signature-review-email-desktop.png"), full: true)
    page.current_window.resize_to(375, 900)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    page.save_screenshot(Rails.root.join("tmp/capybara/signature-review-email-mobile.png"), full: false)
  end

  it "preserves an unsent admin review comment when navigation is cancelled" do
    open_documents
    fill_in "Reply to this review", with: "Unsent private negotiations"
    click_link "All documents"
    within('[role="dialog"]') { click_button "Keep editing" }
    expect(page).to have_field("Reply to this review", with: "Unsent private negotiations")
    click_button "Add review comment"
    expect(page).to have_content("Review updated")
    expect(SignatureReviewComment.last.body).to eq("Unsent private negotiations")
    click_link "All documents"
    expect(page).to have_current_path("/agreements")
    expect(@console_errors).to be_empty
  end

  it "recovers an older package by saving its signing settings as a new version" do
    company.update!(timezone: "Mumbai")
    open_documents
    record = SignatureRequest.find_by!(title: "Synthetic uploaded agreement")
    previous = record.current_revision
    previous.update_columns(signing_options: nil)
    visit current_path
    expect(page).to have_content("Save a new version to record signing settings")
    click_button "Save new version"
    expect(page).to have_content("Time zone: Asia/Kolkata")
    expect(record.reload.current_revision_id).not_to eq(previous.id)
    expect(record.current_revision.documents).to eq(previous.documents)
    expect(record.current_revision.approval_digest).to be_nil
    expect(@console_errors).to be_empty
  end

  it "requires confirmation before a new version discards an unsent review comment" do
    open_documents
    record = SignatureRequest.find_by!(title: "Synthetic uploaded agreement")
    previous_id = record.current_revision_id
    fill_in "Reply to this review", with: "Unsent private negotiations"
    fill_in "Document title", with: "Updated synthetic terms"
    click_button "Save changes"
    within('[role="dialog"]') { click_button "Keep editing" }
    expect(page).to have_field("Document title", with: "Updated synthetic terms")
    expect(page).to have_field("Reply to this review", with: "Unsent private negotiations", disabled: true)
    expect(record.reload.current_revision_id).to eq(previous_id)
    click_button "Save changes"
    within('[role="dialog"]') { click_button "Discard review text and save" }
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    expect(record.reload.current_revision_id).not_to eq(previous_id)
    expect(page).to have_field("Reply to this review", with: "")
    expect(@console_errors).to be_empty
  end

  it "revokes a private review link from the admin screen" do
    open_documents
    add_signer
    click_button "Save changes"
    expect(page).to have_css('[role="status"]', text: "All changes saved")
    click_button "Invite for review"
    expect(page).to have_content("Review invitation queued")
    invitation = SignatureReviewInvitation.last
    click_button "Revoke review link for Synthetic Consultant"
    expect(page).to have_content("Link: Revoked")
    expect(invitation.reload.revoked_at).to be_present
    visit "/document-review##{invitation.access_token}"
    expect(page).to have_content("This review link is unavailable")
    expect(@console_errors).to be_empty
  end
end
