# frozen_string_literal: true

require "system_helper"

describe "Invoice PDF Download", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let(:client) { create(:client, company: company) }
  let(:invoice) do
    create(:invoice,
      client: client,
      company: company,
      invoice_number: "INV-2024-001",
      amount: 1500.00,
      status: :sent
    )
  end

  before do
    create(:employment, user: user, company: company)
    user.add_role(:admin, company)

    # Create invoice line item
    create(:invoice_line_item,
      invoice: invoice,
      name: "Development Services",
      description: "Web development work",
      date: Date.current,
      quantity: 600,
      rate: 100
    )

    sign_in(user)
  end

  it "allows downloading invoice as PDF", js: true do
    visit "/invoices"

    # Find and click on the invoice
    within("[data-testid='invoices-table']") do
      click_link invoice.invoice_number
    end

    # Wait for invoice detail page
    expect(page).to have_content("Invoice Details")
    expect(page).to have_content(invoice.invoice_number)

    # Click download button
    download_button = find("[data-testid='download-pdf-button']")

    # Set up download handler
    page.driver.browser.download_path = Rails.root.join("tmp/downloads")

    download_button.click

    # Wait for download
    sleep 2

    # Check if PDF was downloaded
    download_file = Rails.root.join("tmp/downloads/#{invoice.invoice_number}.pdf")
    expect(File).to exist(download_file)

    # Verify it's a valid PDF
    pdf_content = File.read(download_file)
    expect(pdf_content).to start_with("%PDF")

    # Clean up
    FileUtils.rm_f(download_file)
  end

  it "shows error when PDF generation fails", js: true do
    allow_any_instance_of(InvoicePayment::PdfGeneration).to receive(:process)
      .and_raise(StandardError, "PDF generation failed")

    visit "/invoices/#{invoice.id}"

    # Click download button
    download_button = find("[data-testid='download-pdf-button']")
    download_button.click

    # Should show error message
    expect(page).to have_content("Failed to download invoice")
  end

  it "allows sending invoice via email", js: true do
    visit "/invoices/#{invoice.id}"

    # Click send invoice button
    send_button = find("[data-testid='send-invoice-button']")
    send_button.click

    # Fill in email form
    within(".send-invoice-modal") do
      fill_in "Recipients", with: "client@example.com, accounting@example.com"
      fill_in "Subject", with: "Invoice #{invoice.invoice_number}"
      fill_in "Message", with: "Please find attached your invoice."

      click_button "Send Invoice"
    end

    # Should show success message
    expect(page).to have_content("Invoice sent successfully")

    # Invoice status should be updated
    invoice.reload
    expect(invoice.status).to eq("sent")
  end
end
