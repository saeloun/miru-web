# frozen_string_literal: true

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
