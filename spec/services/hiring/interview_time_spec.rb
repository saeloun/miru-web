# frozen_string_literal: true

require "rails_helper"

RSpec.describe Hiring::InterviewTime do
  def parse(value, zone: "Asia/Kolkata", offset: nil)
    described_class.parse(value, time_zone: zone, utc_offset: offset)
  end

  it "converts candidate-local time to UTC independently of the app's time zone" do
    Time.use_zone("America/Los_Angeles") do
      expect(parse("2027-01-15T14:30")).to eq(Time.utc(2027, 1, 15, 9))
      expect(parse("2027-01-15T14:30").utc?).to be(true)
    end
    expect(parse("2028-02-29T00:15")).to eq(Time.utc(2028, 2, 28, 18, 45))
  end

  it "rejects times that do not exist at a spring DST transition" do
    expect { parse("2027-03-14T02:30", zone: "America/New_York") }
      .to raise_error(Hiring::Intake::InvalidInput, /does not exist/)
    expect { parse("2027-10-03T02:15", zone: "Australia/Lord_Howe") }
      .to raise_error(Hiring::Intake::InvalidInput, /does not exist/)
  end

  it "requires an explicit choice when a local time occurs twice" do
    expect { parse("2027-11-07T01:30", zone: "America/New_York") }
      .to raise_error(Hiring::InterviewTime::Ambiguous) { |error| expect(error.offsets).to contain_exactly("-04:00", "-05:00") }
  end

  it "distinguishes both valid occurrences of an ambiguous local time" do
    expect(parse("2027-11-07T01:30", zone: "America/New_York", offset: "-04:00")).to eq(Time.utc(2027, 11, 7, 5, 30))
    expect(parse("2027-11-07T01:30", zone: "America/New_York", offset: "-05:00")).to eq(Time.utc(2027, 11, 7, 6, 30))
    expect { parse("2027-11-07T01:30", zone: "America/New_York", offset: "+05:30") }
      .to raise_error(Hiring::Intake::InvalidInput, /offset/)
  end

  it "handles a half-hour DST overlap without assuming transitions are one hour" do
    expect(parse("2027-04-04T01:45", zone: "Australia/Lord_Howe", offset: "+11:00")).to eq(Time.utc(2027, 4, 3, 14, 45))
    expect(parse("2027-04-04T01:45", zone: "Australia/Lord_Howe", offset: "+10:30")).to eq(Time.utc(2027, 4, 3, 15, 15))
  end

  it "rejects malformed or impossible dates instead of normalizing them" do
    ["2027-02-29T14:30", "2027-02-30T14:30", "2027-01-15T24:00", "2027-01-15T14:60", "2027-1-15T14:30",
      "2027-01-15 14:30", "2027-01-15T14:30Z", "2027-01-15T14:30+05:30", "", nil, {}, true].each do |value|
      expect { parse(value) }.to raise_error(Hiring::Intake::InvalidInput)
    end
  end

  it "requires a real IANA identifier and validates even unambiguous offsets" do
    ["Mumbai", "Mars/Phobos", "../Asia/Kolkata", "A" * 300, nil, {}, true].each do |zone|
      expect { parse("2027-01-15T14:30", zone:) }.to raise_error(Hiring::Intake::InvalidInput)
    end
    ["+05:00", "+25:99", "0530", "", {}, true].each do |offset|
      expect { parse("2027-01-15T14:30", offset:) }.to raise_error(Hiring::Intake::InvalidInput)
    end
    expect(parse("2027-01-15T14:30", offset: "+05:30")).to eq(Time.utc(2027, 1, 15, 9))
    expect(parse("2027-01-15T14:30", zone: "Etc/UTC", offset: "+00:00")).to eq(Time.utc(2027, 1, 15, 14, 30))
  end

  it "reports invalid string encoding as input validation instead of a parser failure" do
    invalid = (+"\xFF").force_encoding(Encoding::UTF_8)
    expect { parse(invalid) }.to raise_error(Hiring::Intake::InvalidInput)
    expect { parse("2027-01-15T14:30", zone: invalid) }.to raise_error(Hiring::Intake::InvalidInput)
    expect { parse("2027-01-15T14:30", offset: invalid) }.to raise_error(Hiring::Intake::InvalidInput)
  end
end
