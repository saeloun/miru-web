# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectMember, type: :model do
  let(:project_member) { build(:project_member) }

  it "is valid with valid attributes" do
    expect(project_member).to be_valid
  end

  it "is not valid without an hourly_rate" do
    project_member.hourly_rate = nil
    expect(project_member).to_not be_valid
  end
end
