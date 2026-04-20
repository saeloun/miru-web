# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::DemoSeeder do
  describe "#process" do
    let(:company) { create(:company, base_currency: "USD", standard_price: 120) }

    it "creates linked analytics demo data" do
      result = described_class.new(company: company).process

      expect(result[:company]).to eq(company)
      expect(company.clients.where("name LIKE ?", "Analytics Demo%").count).to be >= 3
      expect(company.projects.count).to be >= 5
      expect(company.timesheet_entries.count).to be >= 15
      expect(company.invoices.where("invoice_number LIKE ?", "AN-DEMO-%").count).to be >= 5
      expect(company.payments.count).to be >= 4
      expect(company.expenses.where("description LIKE ?", "Analytics demo expense %").count).to be >= 10
    end

    it "is safe to run more than once without creating uncontrolled duplicates" do
      described_class.new(company: company).process

      first_counts = {
        clients: company.clients.where("email LIKE ?", "analytics.demo.%").count,
        projects: company.projects.count,
        invoices: company.invoices.where("invoice_number LIKE ?", "AN-DEMO-%").count,
        expenses: company.expenses.where("description LIKE ?", "Analytics demo expense %").count
      }

      described_class.new(company: company).process

      expect(company.clients.where("email LIKE ?", "analytics.demo.%").count).to eq(first_counts[:clients])
      expect(company.invoices.where("invoice_number LIKE ?", "AN-DEMO-%").count).to eq(first_counts[:invoices])
      expect(company.expenses.where("description LIKE ?", "Analytics demo expense %").count).to eq(first_counts[:expenses])
    end
  end
end
