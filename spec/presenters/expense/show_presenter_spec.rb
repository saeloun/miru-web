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
      expect(@data[:id]).to eq(expense.id)
      expect(@data).to have_key(:vendor_name)
      expect(@data).to have_key(:category_name)
      expect(@data).to have_key(:amount)
      expect(@data).to have_key(:date)
      expect(@data).to have_key(:description)
      expect(@data).to have_key(:type)
      expect(@data).to have_key(:receipts)
    end
  end
end
