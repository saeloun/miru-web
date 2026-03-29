# frozen_string_literal: true

require "rails_helper"

RSpec.describe Expenses::FetchService do
  describe "#process" do
    let(:company) { create(:company) }
    let(:admin) { create(:user, current_workspace_id: company.id) }
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let!(:admin_expense) do
      create(:expense,
        company:,
        user: admin,
        expense_type: :business,
        vendor_name: "Jetway",
        date: Date.current)
    end
    let!(:employee_expense) do
      create(:expense,
        company:,
        user: employee,
        expense_type: :personal,
        vendor_name: "Cafe 21",
        date: Date.current - 1.day)
    end

    before do
      create(:employment, company:, user: admin)
      create(:employment, company:, user: employee)
      admin.add_role :admin, company
      employee.add_role :employee, company
    end

    it "returns all company expenses for admins" do
      result = described_class.new(company, admin, { page: 1, expenses_per_page: 10 }).process

      expect(result[:expenses].map(&:id)).to eq([employee_expense.id, admin_expense.id])
      expect(result[:categories]).to eq(ExpenseCategory::DEFAULT_CATEGORIES.map { |category| { name: category[:name] } })
    end

    it "returns only the current employee expenses for employees" do
      result = described_class.new(company, employee, { page: 1, expenses_per_page: 10 }).process

      expect(result[:expenses].map(&:id)).to eq([employee_expense.id])
    end

    it "applies the expense type filter" do
      result = described_class.new(company, admin, { page: 1, expenses_per_page: 10, expense_type: "personal" }).process

      expect(result[:expenses].map(&:id)).to eq([employee_expense.id])
    end

    it "applies a date range filter" do
      result = described_class.new(
        company,
        admin,
        { page: 1, expenses_per_page: 10, from: (Date.current - 2.days).to_s, to: (Date.current - 1.day).to_s }
      ).process

      expect(result[:expenses].map(&:id)).to eq([employee_expense.id])
    end

    it "returns real pagination metadata" do
      create_list(:expense, 30, company:, user: admin, expense_type: :business)

      result = described_class.new(company, admin, { page: 2, per: 25 }).process

      expect(result[:expenses].count).to eq(7)
      expect(result[:pagination_details]).to include(
        page: 2,
        pages: 2,
        prev: 1,
        next: nil,
        first: false,
        last: true,
        total: 32
      )
    end
  end
end
