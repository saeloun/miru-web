# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoiceLineItem, type: :model do
  subject { build(:invoice_line_item) }

  describe "Validations" do
    describe "validate presence of" do
      it { is_expected.to validate_presence_of(:name) }
      it { is_expected.to validate_presence_of(:date) }
      it { is_expected.to validate_presence_of(:rate) }
      it { is_expected.to validate_presence_of(:quantity) }
    end

    describe "validate numericality of" do
      it { is_expected.to validate_numericality_of(:quantity).is_greater_than(0).only_integer }
      it { is_expected.to validate_numericality_of(:rate).is_greater_than_or_equal_to(0) }
    end
  end

  describe "Associations" do
    describe "belongs to" do
      it { is_expected.to belong_to(:user) }
      it { is_expected.to belong_to(:invoice) }
      it { is_expected.to belong_to(:timesheet_entry).optional(true) }
    end
  end
end
