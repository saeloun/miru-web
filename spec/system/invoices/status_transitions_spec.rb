# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice status transitions", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Acme Corp") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "shows the major invoice statuses on the index page" do
    create(:invoice, company:, client:, status: :draft, invoice_number: "ST-DRAFT", amount: 100.00, amount_due: 100.00)
    create(:invoice, company:, client:, status: :sent, invoice_number: "ST-SENT", amount: 200.00, amount_due: 200.00, outstanding_amount: 200.00)
    create(:invoice, company:, client:, status: :paid, invoice_number: "ST-PAID", amount: 300.00, amount_due: 0.00, amount_paid: 300.00)
    create(:invoice, company:, client:, status: :overdue, invoice_number: "ST-OVER", amount: 400.00, amount_due: 400.00, outstanding_amount: 400.00, issue_date: 60.days.ago, due_date: 30.days.ago)

    with_forgery_protection do
      visit "/invoices"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Draft", wait: 10)
      expect(page).to have_content("Sent", wait: 10)
      expect(page).to have_content("Paid", wait: 10)
      expect(page).to have_content("Overdue", wait: 10)
      expect(page).to have_content("OUTSTANDING", wait: 10)
        .or have_content("Outstanding", wait: 10)
    end
  end

  {
    draft: "INV-D-001",
    sent: "INV-S-002",
    paid: "INV-P-003",
    overdue: "INV-O-004",
    waived: "INV-W-005"
  }.each do |status, invoice_number|
    it "shows #{status} status on the detail page" do
      invoice = create(:invoice,
        company:,
        client:,
        status:,
        invoice_number:,
        amount: 1000.00,
        amount_due: status == :paid || status == :waived ? 0.00 : 1000.00,
        amount_paid: status == :paid ? 1000.00 : 0.00,
        outstanding_amount: status == :sent || status == :overdue ? 1000.00 : 0.00,
        issue_date: status == :overdue ? 60.days.ago : Date.current,
        due_date: status == :overdue ? 30.days.ago : Date.current,
        sent_at: status == :sent ? 1.day.ago : nil)

      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content(invoice_number, wait: 10)
        expect(page).to have_content(status.to_s.capitalize, wait: 10)
          .or have_content(status.to_s, wait: 10)
      end
    end
  end
end
