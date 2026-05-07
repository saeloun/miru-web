# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice editor preview", type: :system, js: true do
  let(:company) { create(:company, name: "Wayne Enterprises", base_currency: "USD") }
  let(:user_locale) { "en-US" }
  let(:user) { create(:user, current_workspace_id: company.id, locale: user_locale) }
  let(:client) { create(:client, company:, name: "Gotham City Council") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "renders line item quantities in hours and keeps the preview totals hour-based" do
    invoice = create(:invoice,
      company:,
      client:,
      status: :draft,
      invoice_number: "INV-2024-900",
      amount: 1500.00,
      amount_due: 1500.00,
      issue_date: Date.new(2024, 1, 15),
      due_date: Date.new(2024, 2, 15))

    create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Backend Development",
      description: "API integration work",
      rate: 100.00,
      quantity: 900,
      date: Date.new(2024, 1, 10))

    with_forgery_protection do
      visit "/invoices/#{invoice.id}/edit"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_text("Edit invoice", wait: 10)
      expect(page).to have_text("Fill in the details and preview the invoice before sending it.", wait: 10)
      expect(page).to have_content("Description", wait: 10)
      expect(page).not_to have_text("undefined undefined", wait: 1)
      expect(page).to have_text("15:00", wait: 10)
      expect(page).to have_text("$1,500.00", wait: 10)
      expect(page).not_to have_text("$90,000.00", wait: 1)
      expect(page).not_to have_css("[data-testid='invoice-preview'] table", text: "$0.00", wait: 1)
    end
  end

  it "keeps large preview values and long line item text within the invoice card" do
    invoice = create(:invoice,
      company:,
      client:,
      status: :draft,
      invoice_number: "INV-LARGE-VALUES-001",
      amount: 493_826.80,
      amount_due: 493_826.80,
      issue_date: Date.new(2024, 3, 1),
      due_date: Date.new(2024, 3, 31))

    create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "EnterpriseComplianceArchitectureReview" * 4,
      description: "LongPreviewDescriptionWithoutNaturalBreaks" * 8,
      rate: 12_345.67,
      quantity: 2400,
      date: Date.new(2024, 3, 12))

    with_forgery_protection do
      page.current_window.resize_to(1024, 900)
      visit "/invoices/#{invoice.id}/edit"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_text("INV-LARGE-VALUES-001", wait: 10)
      expect(page).to have_text("EnterpriseComplianceArchitectureReview", wait: 10)
      expect(page).to have_text("$493,826.80", wait: 10)

      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
      expect(page.evaluate_script("document.body.scrollWidth <= window.innerWidth + 1")).to be(true)

      overflowing_preview_nodes = page.evaluate_script(<<~JS)
        (() => {
          const preview = document.querySelector('[data-testid="invoice-preview"]');
          const previewRight = preview.getBoundingClientRect().right;

          return Array.from(preview.querySelectorAll('table, td, p, span, div'))
            .filter((element) => element.offsetParent !== null)
            .filter((element) => element.getBoundingClientRect().right > previewRight + 1)
            .map((element) => element.textContent.trim().slice(0, 60));
        })()
      JS

      expect(overflowing_preview_nodes).to eq([])
    ensure
      page.current_window.resize_to(1400, 1000)
    end
  end

  context "when the signed-in user uses a translated locale" do
    let(:user_locale) { "te" }

    it "renders the editor copy without missing translation text" do
      invoice = create(:invoice,
        company:,
        client:,
        status: :draft,
        invoice_number: "INV-2024-901",
        amount: 250.00,
        amount_due: 250.00,
        issue_date: Date.new(2024, 1, 15),
        due_date: Date.new(2024, 2, 15))

      create(:invoice_line_item,
        invoice:,
        timesheet_entry: nil,
        name: "Design review",
        description: "QA polish",
        rate: 100.00,
        quantity: 150,
        date: Date.new(2024, 1, 10))

      with_forgery_protection do
        visit "/invoices/#{invoice.id}/edit"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_text("ఇన్వాయిస్‌ను సవరించండి", wait: 10)
        expect(page).to have_text("ఇన్వాయిస్‌ను పంపించే ముందు వివరాలు నింపి ప్రివ్యూ చూడండి.", wait: 10)
        expect(page).not_to have_text("[missing", wait: 1)
      end
    end
  end
end
