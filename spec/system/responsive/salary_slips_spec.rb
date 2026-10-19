# frozen_string_literal: true

require "rails_helper"
require "tmpdir"

RSpec.describe "Salary-slip browser workflows", type: :system, js: true do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let!(:admin_employment) { create(:employment, company:, user: admin, resigned_at: nil) }
  let!(:employment) { create(:employment, company:, user: employee, resigned_at: nil) }
  let(:draft_slip) do
    employment.salary_slips.create!(uploaded_by: admin, source: "Approved provider", pay_month: "2026-09-01",
      file: { io: File.open(Rails.root.join("spec/support/fixtures/pdf-file.pdf")),
              filename: "approved.pdf", content_type: "application/pdf" })
  end

  before do
    admin.add_role(:admin, company)
    employee.add_role(:employee, company)
  end

  it "explains an unavailable PDF without hiding the published slip or leaving download disabled" do
    slip = draft_slip
    slip.publish!(actor: admin)
    slip.file.blob.service.delete(slip.file.blob.key)
    sign_in(employee)
    with_forgery_protection do
      visit "/salary-slips"
      click_button "Download"
      expect(page).to have_css("[role='alert']", text: "Document is unavailable. Please contact your workspace administrator.")
      expect(page).to have_button("Download", disabled: false)
      expect(page).to have_css("tbody tr", text: "Published")
    end
  end

  it "shows a competing withdrawal's publication error inside the still-open confirmation" do
    slip = draft_slip
    sign_in(admin)
    with_forgery_protection do
      visit "/salary-slips"
      click_button "Publish salary slip"
      slip.withdraw!(actor: admin)
      within("[role='dialog']") do
        click_button "Confirm"
        expect(page).to have_css("[role='alert']", text: "Import a new revision instead of republishing a withdrawn slip")
        expect(page).to have_button("Cancel", disabled: false)
      end
      click_button "Cancel"
      expect(page).not_to have_css("[role='dialog']")
      expect(page).to have_css("[role='alert']", text: "Import a new revision instead of republishing a withdrawn slip")
      click_button "Withdraw salary slip"
      within("[role='dialog']") { expect(page).not_to have_css("[role='alert']") }
      expect(slip.reload.status).to eq("withdrawn")
    end
  end

  it "restores focus after confirmation dismissal and uses the heading when publication removes its opener" do
    slip = draft_slip
    sign_in(admin)
    with_forgery_protection do
      visit "/salary-slips"
      click_button "Publish salary slip"
      find_button("Close").send_keys(:escape)
      expect(page).not_to have_css("[role='dialog']")
      expect(page).to have_css("button:focus", text: "Publish salary slip", exact_text: true)
      click_button "Publish salary slip"
      within("[role='dialog']") { click_button "Cancel" }
      expect(page).to have_css("button:focus", text: "Publish salary slip", exact_text: true)
      click_button "Publish salary slip"
      within("[role='dialog']") { click_button "Confirm" }
      expect(page).not_to have_css("[role='dialog']")
      expect(page).to have_css("tbody tr", text: "Published")
      expect(page).to have_css("h1:focus", text: "Salary slips", exact_text: true)
      expect(slip.reload.status).to eq("published")
    end
  end

  it "preserves assigned PDFs when a replacement selection exceeds the file limits" do
    sign_in(admin)
    with_forgery_protection do
      visit "/salary-slips"
      fill_in "Payroll provider or source", with: "Approved payroll provider"
      Dir.mktmpdir("salary-slip-limits") do |directory|
        queued = File.join(directory, "queued.pdf")
        FileUtils.cp(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), queued)
        oversized = File.join(directory, "oversized.pdf")
        File.open(oversized, "wb") { |file| file.truncate(5.megabytes + 1) }
        too_many = Array.new(21) do |index|
          File.join(directory, "replacement-#{index}.pdf").tap { |path| FileUtils.cp(queued, path) }
        end
        attach_file "PDF documents", queued
        find("[aria-label='Employee queued.pdf']").click
        find("[role='option']", text: "#{employee.full_name} (#{employee.email})", exact_text: true).click
        page.execute_script(<<~JS, find("input[aria-label='Pay month queued.pdf']"))
          const input = arguments[0];
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "2026-09");
          input.dispatchEvent(new Event("input", { bubbles: true }));
        JS
        expect(page).to have_button("Save drafts", disabled: false)
        [oversized, too_many].each do |selection|
          attach_file "PDF documents", selection
          expect(page).to have_css("[role='alert']", text: "20 PDFs")
          expect(find("input[aria-label='Pay month queued.pdf']").value).to eq("2026-09")
          expect(find("[aria-label='Employee queued.pdf']")).to have_text(employee.full_name)
          expect(page).to have_button("Save drafts", disabled: false)
        end
        click_button "Save drafts"
        expect(page).to have_css("tbody tr", text: "queued.pdf", count: 1)
        expect(employment.salary_slips.count).to eq(1)
      end
    end
  end

  it "saves later valid PDFs after a failed row and allows removing and reselecting the same file" do
    sign_in(admin)
    with_forgery_protection do
      visit "/salary-slips"
      fill_in "Payroll provider or source", with: "Approved payroll provider"
      Dir.mktmpdir("salary-slip-batch") do |directory|
        files = %w[first.pdf invalid.pdf last.pdf].map { |name| File.join(directory, name) }
        [files.first, files.last].each { |path| FileUtils.cp(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), path) }
        File.write(files[1], "Not a PDF")
        attach_file "PDF documents", files
        files.zip(%w[2026-09 2026-08 2026-07]).each do |path, month|
          filename = File.basename(path)
          find("[aria-label='Employee #{filename}']").click
          find("[role='option']", text: "#{employee.full_name} (#{employee.email})", exact_text: true).click
          month_input = find("input[aria-label='Pay month #{filename}']")
          # Cuprite's text setter does not commit native month inputs.
          page.execute_script(<<~JS, month_input, month)
            const [input, value] = arguments;
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
            input.dispatchEvent(new Event("input", { bubbles: true }));
          JS
        end
        click_button "Save drafts"
        expect(page).to have_css("tbody tr", text: "Draft", count: 2)
        expect(page).to have_content("invalid.pdf: File must be a PDF")
        expect(find("input[aria-label='Pay month invalid.pdf']").value).to eq("2026-08")
        expect(find("[aria-label='Employee invalid.pdf']")).to have_text(employee.full_name)
        expect(page).to have_css("button[aria-label='Remove invalid.pdf']:not(:disabled)")
        expect(page).not_to have_css("button[aria-label='Remove first.pdf']")
        expect(page).not_to have_css("button[aria-label='Remove last.pdf']")
        find("button[aria-label='Remove invalid.pdf']").click
        attach_file "PDF documents", files[1]
        expect(page).to have_css("button[aria-label='Remove invalid.pdf']")
        expect(find("#slip-files").value).to eq("")
      end
    end
  end

  it "shows only the employee's published slip on mobile without management actions or page overflow" do
    [admin_employment, employment].each do |membership|
      slip = membership.salary_slips.new(uploaded_by: admin, source: "Approved payroll provider", pay_month: "2026-09-01")
      slip.file.attach(io: File.open(Rails.root.join("spec/support/fixtures/pdf-file.pdf")),
        filename: "employment-#{membership.id}.pdf", content_type: "application/pdf")
      slip.save!
      slip.publish!(actor: admin)
    end
    sign_in(employee)
    with_forgery_protection do
      page.current_window.resize_to(390, 844)
      visit "/salary-slips"
      expect(page).to have_css("tbody tr", count: 1)
      expect(page).to have_content("employment-#{employment.id}.pdf")
      expect(page).not_to have_content("employment-#{admin_employment.id}.pdf")
      expect(page).to have_button("Download")
      expect(page).not_to have_button("Publish salary slip")
      expect(page).not_to have_button("Withdraw salary slip")
      expect(page).not_to have_field("PDF documents")
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    end
  end
end
