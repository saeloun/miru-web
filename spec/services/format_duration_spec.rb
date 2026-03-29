# frozen_string_literal: true

require "rails_helper"

RSpec.describe FormatDuration do
  describe "#process" do
    it "formats seconds into hh:mm" do
      expect(described_class.process(3660)).to eq("01:01")
    end

    it "handles zero duration" do
      expect(described_class.process(0)).to eq("00:00")
    end
  end
end
