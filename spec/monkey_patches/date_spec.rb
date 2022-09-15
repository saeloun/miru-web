# frozen_string_literal: true

require "rails_helper"

RSpec.describe Date, type: :class do
  describe "#ordinalize" do
    let(:date) { Date.today }

    context "when year is true" do
      it "returns ordinalized date with year" do
        expect(date.ordinalize).to eq(date.strftime("%B #{date.day.ordinalize}, %Y"))
      end
    end

    context "when year is false" do
      it "returns ordinalized date without year" do
        expect(date.ordinalize(year: false)).to eq(date.strftime("%B #{date.day.ordinalize}"))
      end
    end
  end
end
