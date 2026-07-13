# frozen_string_literal: true

# == Schema Information
#
# Table name: expenses
#
#  id                  :bigint           not null, primary key
#  amount              :decimal(20, 2)   default(0.0), not null
#  date                :date             not null
#  description         :text
#  expense_type        :integer
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  company_id          :bigint           not null
#  expense_category_id :bigint           not null
#  vendor_id           :bigint
#
# Indexes
#
#  index_expenses_on_company_id           (company_id)
#  index_expenses_on_description_trgm     (description) USING gin
#  index_expenses_on_expense_category_id  (expense_category_id)
#  index_expenses_on_expense_type         (expense_type)
#  index_expenses_on_vendor_id            (vendor_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (expense_category_id => expense_categories.id)
#  fk_rails_...  (vendor_id => vendors.id)
#
require "rails_helper"

RSpec.describe Expense, type: :model do
  let(:expense) { build(:expense) }

  describe "Validations" do
    it { is_expected.to validate_presence_of(:date) }

    describe "receipt constraints" do
      def attach_receipt(content_type:, byte_size: 1.kilobyte)
        expense.receipts.attach(
          io: StringIO.new("x" * byte_size),
          filename: "receipt",
          content_type:,
          identify: false
        )
      end

      it "rejects an oversized receipt" do
        attach_receipt(content_type: "application/pdf", byte_size: 10.megabytes + 1)

        expect(expense).not_to be_valid
        expect(expense.errors[:receipts]).to be_present
      end

      it "rejects SVG content" do
        attach_receipt(content_type: "image/svg+xml")

        expect(expense).not_to be_valid
        expect(expense.errors[:receipts]).to be_present
      end

      it "accepts a PDF receipt within the size limit" do
        attach_receipt(content_type: "application/pdf")

        expect(expense).to be_valid
        expect(expense.errors[:receipts]).to be_empty
      end

      it "rejects more than ten receipts" do
        11.times { attach_receipt(content_type: "image/png", byte_size: 1) }

        expect(expense).not_to be_valid
        expect(expense.errors[:receipts]).to be_present
      end
    end
  end

  describe "validate numericality of" do
    it { is_expected.to validate_numericality_of(:amount).is_greater_than(0) }
  end

  describe "currency" do
    it "defaults to the company base currency" do
      company = build(:company, base_currency: "INR")
      expense = build(:expense, company:, currency: nil)

      expense.valid?

      expect(expense.currency).to eq("INR")
    end

    it "normalizes currency codes" do
      expense.currency = " inr "

      expense.valid?

      expect(expense.currency).to eq("INR")
    end

    it "requires a three-letter currency code" do
      expense.currency = "US"

      expect(expense).not_to be_valid
      expect(expense.errors[:currency]).to be_present
    end

    it "requires a known currency code" do
      expense.currency = "ZZZ"

      expect(expense).not_to be_valid
      expect(expense.errors[:currency]).to be_present
    end
  end

  describe "validate enum" do
    it do
      expect(subject).to define_enum_for(:expense_type)
        .with_values([:personal, :business])
    end
  end

  describe "Associations" do
    it { is_expected.to belong_to(:company) }
  end
end
