# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invoice, type: :model do
  subject(:invoice) { build(:invoice_with_invoice_line_items) }

  describe "Validations" do
    describe "validate presence of" do
      it { is_expected.to validate_presence_of(:issue_date) }
      it { is_expected.to validate_presence_of(:due_date) }
      it { is_expected.to validate_presence_of(:invoice_number) }
    end

    describe "validate uniqueness of" do
      it { is_expected.to validate_uniqueness_of(:invoice_number) }
    end

    describe "validate comparisons" do
      it "issue_date should not be after due_date" do
        expect(invoice.issue_date).to be < invoice.due_date
      end
    end

    describe "validate numericality of" do
      it { is_expected.to validate_numericality_of(:amount).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:outstanding_amount).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:tax).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:amount_paid).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:amount_due).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:discount).is_greater_than_or_equal_to(0) }
    end

    describe "validate enum" do
      it do
        is_expected.to define_enum_for(:status)
          .with_values([:draft, :sent, :viewed, :paid, :declined, :overdue])
      end
    end
  end

  describe "Associations" do
    describe "belongs to" do
      it { is_expected.to belong_to(:company) }
      it { is_expected.to belong_to(:client) }
    end

    describe "has many" do
      it { is_expected.to have_many(:invoice_line_items) }

      it "sub_total should tally with amount of all invoice line items combined" do
        expect(invoice.sub_total).to eq(invoice.invoice_line_items.sum { |line_item| line_item[:rate] * line_item[:quantity] })
      end
    end
  end
end
