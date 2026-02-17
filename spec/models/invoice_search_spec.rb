# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice search functionality" do
  let(:company) { create(:company) }
  let(:client1) { create(:client, name: "Client A", company: company) }
  let(:client2) { create(:client, name: "Client B", company: company) }

  describe "Invoice.search" do
    let!(:invoice1) { create(:invoice, invoice_number: "INV-2024-001", status: :draft, client: client1, company: company, issue_date: Date.today) }
    let!(:invoice2) { create(:invoice, invoice_number: "INV-2024-002", status: :sent, client: client1, company: company, issue_date: 1.week.ago) }
    let!(:invoice3) { create(:invoice, invoice_number: "INV-2024-003", status: :paid, client: client2, company: company, issue_date: 1.month.ago) }
    let!(:invoice4) { create(:invoice, invoice_number: "INV-2024-004", status: :overdue, client: client2, company: company, issue_date: 2.months.ago) }

    describe "basic search" do
      it "finds invoices by exact invoice number" do
        results = Invoice.search("INV-2024-001")
        expect(results).to include(invoice1)
        expect(results.count).to eq(1)
      end

      it "finds invoices by partial invoice number" do
        results = Invoice.search("2024")
        expect(results).to include(invoice1, invoice2, invoice3, invoice4)
      end

      it "finds invoices by number prefix" do
        results = Invoice.search("INV")
        expect(results.count).to eq(4)
      end

      it "returns empty for non-matching search" do
        results = Invoice.search("INV-2025")
        expect(results).to be_empty
      end
    end

    describe "filtering by status" do
      it "finds draft invoices" do
        results = Invoice.search("", where: { status: "draft" })
        expect(results).to include(invoice1)
        expect(results).not_to include(invoice2, invoice3, invoice4)
      end

      it "finds sent invoices" do
        results = Invoice.search("", where: { status: "sent" })
        expect(results).to include(invoice2)
        expect(results.count).to eq(1)
      end

      it "finds paid invoices" do
        results = Invoice.search("", where: { status: "paid" })
        expect(results).to include(invoice3)
      end

      it "finds overdue invoices" do
        results = Invoice.search("", where: { status: "overdue" })
        expect(results).to include(invoice4)
      end

      it "finds multiple statuses" do
        results = Invoice.search("", where: { status: ["sent", "overdue"] })
        expect(results).to include(invoice2, invoice4)
        expect(results).not_to include(invoice1, invoice3)
      end
    end

    describe "filtering by date ranges" do
      it "filters by issue date" do
        results = Invoice.search("", where: { issue_date: 2.weeks.ago..Date.today })
        expect(results).to include(invoice1, invoice2)
        expect(results).not_to include(invoice3, invoice4)
      end

      it "filters by due date" do
        invoice1.update!(due_date: 1.week.from_now)
        invoice2.update!(due_date: 2.weeks.from_now)

        results = Invoice.search("", where: { due_date: Date.today..2.weeks.from_now })
        expect(results).to include(invoice1, invoice2)
      end
    end

    describe "filtering by client" do
      it "finds invoices for specific client" do
        results = Invoice.search("", where: { client_id: client1.id })
        expect(results).to include(invoice1, invoice2)
        expect(results).not_to include(invoice3, invoice4)
      end

      it "excludes specific clients" do
        results = Invoice.search("", where: { client_id: { not: client1.id } })
        expect(results).to include(invoice3, invoice4)
        expect(results).not_to include(invoice1, invoice2)
      end
    end

    describe "filtering by company" do
      let(:company2) { create(:company) }
      let(:client3) { create(:client, company: company2) }
      let!(:other_company_invoice) { create(:invoice, client: client3, company: company2) }

      it "filters by company_id" do
        results = Invoice.search("", where: { company_id: company.id })
        expect(results).to include(invoice1, invoice2, invoice3, invoice4)
        expect(results).not_to include(other_company_invoice)
      end
    end

    describe "with discarded invoices" do
      let!(:discarded_invoice) { create(:invoice, invoice_number: "INV-DISC-001", client: client1, company: company, discarded_at: Time.current) }

      it "excludes discarded invoices when filtered" do
        results = Invoice.search("", where: { discarded_at: nil })
        expect(results).not_to include(discarded_invoice)
        expect(results).to include(invoice1, invoice2, invoice3, invoice4)
      end

      it "finds discarded invoices when searching" do
        results = Invoice.search("DISC")
        expect(results).to include(discarded_invoice)
      end
    end

    describe "ordering" do
      it "orders by issue date descending" do
        results = Invoice.search("", order: { issue_date: :desc })
        dates = results.pluck(:issue_date)
        expect(dates).to eq(dates.sort.reverse)
      end

      it "orders by invoice number ascending" do
        results = Invoice.search("", order: { invoice_number: :asc })
        numbers = results.pluck(:invoice_number)
        expect(numbers).to eq(numbers.sort)
      end

      it "orders by multiple columns" do
        results = Invoice.search("", order: { status: :asc, issue_date: :desc })
        expect(results.first.status).to eq("draft")
      end
    end

    describe "pagination" do
      before do
        create_list(:invoice, 10, client: client1, company: company)
      end

      it "limits results" do
        results = Invoice.search("", limit: 5)
        expect(results.count).to eq(5)
      end

      it "paginates correctly" do
        page1 = Invoice.search("", page: 1, per_page: 5)
        page2 = Invoice.search("", page: 2, per_page: 5)

        expect(page1.count).to eq(5)
        expect(page2.count).to eq(5)
        expect(page1.pluck(:id)).not_to match_array(page2.pluck(:id))
      end
    end

    describe "complex queries" do
      it "combines search term with status filter" do
        results = Invoice.search("2024", where: { status: "paid" })
        expect(results).to include(invoice3)
        expect(results).not_to include(invoice1, invoice2, invoice4)
      end

      it "combines multiple filters with search" do
        results = Invoice.search("INV", where: {
          status: ["sent", "paid"],
          issue_date: 2.months.ago..Date.today
        })
        expect(results).to include(invoice2, invoice3)
        expect(results).not_to include(invoice1, invoice4)
      end
    end

    describe "case sensitivity" do
      it "is case insensitive for invoice number" do
        expect(Invoice.search("inv-2024-001")).to include(invoice1)
        expect(Invoice.search("INV-2024-001")).to include(invoice1)
      end
    end
  end
end
