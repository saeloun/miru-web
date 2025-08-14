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
  end

  describe "validate numericality of" do
    it { is_expected.to validate_numericality_of(:amount).is_greater_than(0) }
  end

  describe "validate enum" do
    it do
      expect(subject).to define_enum_for(:expense_type)
        .with_values([:personal, :business])
    end
  end

  describe "Associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:expense_category) }
    it { is_expected.to belong_to(:vendor).optional }
  end
end
