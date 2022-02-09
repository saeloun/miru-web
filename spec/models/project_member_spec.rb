# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectMember, type: :model do
  describe "validations" do
    subject { build(:project_member) }

    it { should validate_presence_of(:hourly_rate) }
    it { should belong_to(:user) }
    it { should belong_to(:project) }

    it "is valid with valid attributes" do
      expect(project_member).to be_valid
    end
  end
end
