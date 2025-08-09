# frozen_string_literal: true

require "rails_helper"

RSpec.describe Setting, type: :model do
  describe "constants" do
    it "defines TIME_INTERVAL with correct values" do
      expect(Setting::TIME_INTERVAL).to eq(%i[min hr])
    end
  end

  describe "fields" do
    it "has default value for number_of_email" do
      expect(Setting.number_of_email).to eq(5)
    end

    it "has default value for interval_length" do
      expect(Setting.interval_length).to eq(5)
    end

    it "has default value for interval_unit" do
      expect(Setting.interval_unit).to eq(:min)
    end
  end

  describe ".current_inteval_start_timestamp" do
    context "when interval_unit is minutes" do
      before do
        Setting.interval_unit = :min
        Setting.interval_length = 10
      end

      it "returns timestamp 10 minutes ago" do
        current_time = Time.current
        expected_time = current_time - 10.minutes
        expect(Setting.current_inteval_start_timestamp).to be_within(2.seconds).of(expected_time)
      end
    end

    context "when interval_unit is hours" do
      before do
        Setting.interval_unit = :hr
        Setting.interval_length = 2
      end

      it "returns timestamp 2 hours ago" do
        current_time = Time.current
        expected_time = current_time - 2.hours
        expect(Setting.current_inteval_start_timestamp).to be_within(2.seconds).of(expected_time)
      end
    end
  end

  describe "validations" do
    it "validates interval_unit inclusion in TIME_INTERVAL" do
      expect(Setting::TIME_INTERVAL).to include(:min)
      expect(Setting::TIME_INTERVAL).to include(:hr)
      expect(Setting::TIME_INTERVAL).not_to include(:invalid)
    end
  end

  describe "persistence" do
    it "persists settings across requests" do
      Setting.number_of_email = 10
      Setting.interval_length = 15
      Setting.interval_unit = :hr

      expect(Setting.number_of_email).to eq(10)
      expect(Setting.interval_length).to eq(15)
      expect(Setting.interval_unit).to eq(:hr)
    end
  end
end
