# frozen_string_literal: true

require "rails_helper"

RSpec.describe Expense::ShowPresenter do
  let(:company) { create :company }
  let(:expense_category) { create(:expense_category, company:) }
  let(:vendor) { create(:vendor, company:) }
  let(:expense) { create(:expense, :with_receipts, company:, expense_category:, vendor:) }

  describe "show_data" do
    before do
      @data = Expense::ShowPresenter.new(expense).process
    end

    it "returns required data of expense" do
      expect(@data).to eq(
        {
          id: expense.id,
          vendor_name: vendor.name,
          category_name: expense_category.name,
          amount: expense.amount,
          date: expense.formatted_date,
          description: expense.description,
          type: expense.expense_type,
          receipts: expense.attached_receipts_urls
        })
    end
  end
end
