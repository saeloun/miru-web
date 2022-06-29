# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invitation, type: :model do
  subject { build(:invitation) }

  describe "Associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:sender) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:recipient_email) }
    it { is_expected.to validate_presence_of(:role) }
    it { is_expected.to validate_presence_of(:token) }
    it { is_expected.to validate_uniqueness_of(:token) }
  end
end
