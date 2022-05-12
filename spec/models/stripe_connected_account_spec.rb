# frozen_string_literal: true

require "rails_helper"

RSpec.describe StripeConnectedAccount, type: :model do
  subject { build(:stripe_connected_account) }

  describe "Validations" do
    describe "validate uniqueness of" do
      it { is_expected.to validate_uniqueness_of(:account_id) }
    end
  end

  describe "Associations" do
    describe "belongs to" do
      it { is_expected.to belong_to(:company) }
    end
  end
end
