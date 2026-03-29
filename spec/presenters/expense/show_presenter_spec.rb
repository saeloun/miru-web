# frozen_string_literal: true

require "rails_helper"

RSpec.describe Expense::ShowPresenter do
  let(:company) { create :company }
  let(:expense) { create(:expense, :with_receipts, company:, category_name: "Travel", vendor_name: "Jetway") }

  describe "show_data" do
    before do
      @data = Expense::ShowPresenter.new(expense).process
    end

    it "returns required data of expense" do
      expect(@data).to eq(
        {
          id: expense.id,
          vendor_name: "Jetway",
          category_name: "Travel",
          amount: expense.amount,
          date: expense.formatted_date,
          description: expense.description,
          type: expense.expense_type,
          receipts: expense.attached_receipts_urls,
          status: expense.status,
          paid_at: expense.paid_at,
          submitter_name: expense.submitter_name
        })
    end
  end
end
