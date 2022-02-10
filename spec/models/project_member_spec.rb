# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectMember, type: :model do
  subject { build(:project_member) }
  describe "validations" do
    it { should validate_presence_of(:hourly_rate) }
  end

  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:project) }
  end
end
