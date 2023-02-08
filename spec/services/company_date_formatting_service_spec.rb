# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompanyDateFormattingService do
  let!(:us_company) { create(:company) }
  let!(:ind_company) { create(:india_company) }
  let!(:date) { Date.parse("2022-02-03") } # Thu, 03 Feb 2022

  describe "#process" do
    context "when company date format is MM-DD-YYYY" do
      it { expect(described_class.new(date, company: us_company).process()).to eq("02.03.2022") }
    end

    context "when company when date format is DD-MM-YYYY" do
      it { expect(described_class.new(date, company: ind_company).process()).to eq("03.02.2022") }
    end

    context "when company has no date format set" do
      before do
        us_company.update!(date_format: nil)
      end

      it { expect(described_class.new(date, company: ind_company).process()).to eq("03.02.2022") }
    end

    context "without company" do
      it { expect(described_class.new(date).process()).to eq(nil) }
    end
  end
end
