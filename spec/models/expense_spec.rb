# frozen_string_literal: true

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
