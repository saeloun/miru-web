# frozen_string_literal: true

require "rails_helper"

RSpec.describe Entry, type: :model do
  let(:entry) { build(:entry) }

  it "is valid with valid attributes" do
    expect(entry).to be_valid
  end

  it "is not valid without a duration" do
    entry.duration = nil
    expect(entry).to_not be_valid
  end

  it "is not valid if duration is greater than 24 hours" do
    entry.duration = 25
    expect(entry).to_not be_valid
  end

  it "is not valid without a note" do
    entry.note = nil
    expect(entry).to_not be_valid
  end

  it "is not valid without a wotk_date" do
    entry.work_date = nil
    expect(entry).to_not be_valid
  end
end
