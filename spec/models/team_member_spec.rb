# frozen_string_literal: true

require "rails_helper"

RSpec.describe TeamMember, type: :model do
  let(:team_member) { build(:team_member) }

  it "is valid with valid attributes" do
    expect(team_member).to be_valid
  end

  it "is not valid without an hourly_rate" do
    team_member.hourly_rate = nil
    expect(team_member).to_not be_valid
  end
end
