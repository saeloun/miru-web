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
      it { is_expected.to validate_numericality_of(:quantity).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:rate).is_greater_than_or_equal_to(0) }
    end
  end

  describe "callbacks" do
    it { is_expected.to callback(:unlock_timesheet_entry).before(:destroy) }
  end

  describe "Associations" do
    describe "belongs to" do
      it { is_expected.to belong_to(:invoice) }
      it { is_expected.to belong_to(:timesheet_entry).optional(true) }
    end
  end

  describe "Class Methods" do
    describe ".total_cost_of_all_line_items" do
      let(:invoice_line_item_1) { create :invoice_line_item }
      let(:invoice_line_item_2) { create :invoice_line_item }
      let(:invoice_line_item_3) { create :invoice_line_item }

      it "returns the number of hours multiplied by rate" do
        total_cost = invoice_line_item_1.total_cost + invoice_line_item_2.total_cost + invoice_line_item_3.total_cost

        expect(
          InvoiceLineItem.where(
            id: [
                          invoice_line_item_1.id,
                          invoice_line_item_2.id,
                          invoice_line_item_3.id
                        ]
                    ).total_cost_of_all_line_items
        ).to be_within(0.001).of(total_cost)
      end
    end
  end

  describe ".hours_spent" do
    let(:invoice_line_item) { create :invoice_line_item }

    it "returns the hours spent" do
      expect(invoice_line_item.hours_spent).to eq(invoice_line_item.quantity.to_f / 60)
      expect(invoice_line_item.hours_spent).to be_a_kind_of(Float)
    end
  end

  describe ".minutes_spent" do
    let(:invoice_line_item) { create :invoice_line_item }

    it "returns the hours spent" do
      expect(invoice_line_item.minutes_spent).to eq(invoice_line_item.quantity.to_f % 60)
      expect(invoice_line_item.minutes_spent).to be_a_kind_of(Float)
    end
  end

  describe ".time_spent" do
    let(:invoice_line_item) { create :invoice_line_item }

    describe "when quantity is 0" do
      it "returns 0" do
        invoice_line_item.quantity = 0
        expect(invoice_line_item.time_spent).to eq("00:00")
      end
    end

    describe "when hours is one digit" do
      it "returns a leading zero" do
        invoice_line_item.quantity = 90
        expect(invoice_line_item.time_spent).to eq("01:30")
      end
    end

    describe "when minutes is one digit" do
      it "returns a leading zero" do
        invoice_line_item.quantity = 61
        expect(invoice_line_item.time_spent).to eq("01:01")
      end
    end

    describe "when hours and minutes are two digits" do
      it "returns no leading zeros" do
        invoice_line_item.quantity = 630
        expect(invoice_line_item.time_spent).to eq("10:30")
      end
    end
  end

  describe ".total_cost" do
    let(:invoice_line_item) { create :invoice_line_item }

    it "returns the number of hours multiplied by rate" do
      expect(invoice_line_item.total_cost).to eq((invoice_line_item.hours_spent * invoice_line_item.rate).round(3))
    end
  end
end
