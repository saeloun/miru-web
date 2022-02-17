# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectMember, type: :model do
  subject { build(:project_member) }

  describe "Associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:project) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:hourly_rate) }
  end
end
