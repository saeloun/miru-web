# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client billing identity", type: :system, js: true do
  let(:company) { create(:company, name: "Miru Agreement QA") }
  let(:user) { create(:user, current_workspace: company) }
  let(:client) do
    create(:client, company:, name: "QA display alias", logo: nil,
      legal_name: "Example International & Consulting Private Limited",
      email: "primary@example.test", finance_email: "finance@example.test",
      signatory_email: "signer@example.test")
  end
  let(:invoice) { create(:invoice_with_invoice_line_items, company:, client:, invoice_number: "QA-AGREEMENT-001") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") do |event|
      @console_errors << event if event["type"] == "error"
    end
    @invoice_mail = nil
    allow(InvoiceMailer).to receive(:with).and_wrap_original do |method, **params|
      @invoice_mail = params
      method.call(**params)
    end
  end

  after { expect(@console_errors).to be_empty }

  it "prefills finance on the list and queues the chosen recipients with a real PDF" do
    invoice
    visit "/invoices"
    find("[data-testid='invoice-actions-trigger-#{invoice.id}']").click
    find("[data-testid='invoice-action-send-#{invoice.id}']").click

    expect(page).to have_text(client.finance_email)
    expect(page).to have_text(client.email)
    expect(page).to have_no_text(client.signatory_email)
    page.save_screenshot(Rails.root.join("tmp/capybara/client-invoice-recipients.png"), full: true)
    expect do
      click_button "Send Invoice"
      expect(page).to have_text("Invoice has been sent successfully", wait: 10)
    end.to have_enqueued_mail(InvoiceMailer, :send_invoice).once

    expect(@invoice_mail[:recipients]).to contain_exactly(client.email, client.finance_email)
    pdf = Base64.strict_decode64(@invoice_mail.fetch(:pdf_data))
    expect(pdf).to start_with("%PDF-")
    FileUtils.mkdir_p(Rails.root.join("output/pdf"))
    File.binwrite(Rails.root.join("output/pdf/client-legal-name-invoice.pdf"), pdf)
  end

  it "uses the legal billed-to name and preserves an explicit recipient override" do
    visit "/invoices/#{invoice.id}"
    within("[data-testid='invoice-preview']") { expect(page).to have_text(client.legal_name) }
    page.save_screenshot(Rails.root.join("tmp/capybara/client-invoice-legal-name.png"), full: true)
    find("[data-testid='invoice-preview-send-action']").click
    expect(page).to have_text(client.finance_email)
    find("[data-testid='invoice-recipient-input']").send_keys("chosen@example.test", :enter)
    within("[role='dialog']") do
      [client.email, client.finance_email].each do |email|
        find("p", exact_text: email).find(:xpath, "..").find("button").click
      end
    end

    click_button "Send Invoice"
    expect(page).to have_text("Invoice has been sent successfully", wait: 10)
    expect(@invoice_mail[:recipients]).to eq(["chosen@example.test"])
  end

  it "sends from the new invoice editor when only finance email is configured" do
    client.update!(email: nil)
    visit_new_invoice_for(client)
    fill_in "invoiceNumber", with: "QA-FINANCE-ONLY-001"
    add_manual_line_item(name: "Consulting", rate: "100", quantity: "02:00")
    click_button "Send Invoice"

    expect(page).to have_text("Invoice has been sent successfully", wait: 10)
    expect(@invoice_mail[:recipients]).to eq([client.finance_email])
    expect(Invoice.find_by!(invoice_number: "QA-FINANCE-ONLY-001")).to be_sent
  end

  it "deduplicates a finance address matching the primary address regardless of case" do
    client.update!(finance_email: client.email.upcase)
    visit "/invoices/#{invoice.id}"
    find("[data-testid='invoice-preview-send-action']").click
    click_button "Send Invoice"

    expect(page).to have_text("Invoice has been sent successfully", wait: 10)
    expect(@invoice_mail[:recipients].map(&:downcase)).to eq([client.email])
  end

  it "shows the legal name on a shared invoice without exposing private contacts" do
    invoice.update!(status: :sent)
    sign_out user
    page.current_window.resize_to(1440, 1000)
    visit "/invoices/#{invoice.external_view_key}/view"

    expect(page).to have_text(client.legal_name)
    expect(page).to have_no_text(client.finance_email)
    expect(page).to have_no_text(client.signatory_email)
  end
end
