# frozen_string_literal: true

# == Schema Information
#
# Table name: expense_categories
#
#  id         :bigint           not null, primary key
#  default    :boolean          default(FALSE)
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  company_id :bigint
#
# Indexes
#
#  index_expense_categories_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require "rails_helper"

RSpec.describe ExpenseCategory, type: :model do
  subject { build(:expense_category) }

  describe "Validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:name).scoped_to(:company_id) }
  end

  describe "Associations" do
    it { is_expected.to have_many(:expenses) }
    it { is_expected.to belong_to(:company).optional }
  end
end
