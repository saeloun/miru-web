# frozen_string_literal: true

require "rails_helper"

RSpec.describe StripeConnectedAccount, type: :model do
  subject(:stripe_connected_account) { build(:stripe_connected_account) }

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

  describe "Instance methods" do
    describe "#details_submitted" do
      it "returns false" do
        allow(Stripe::Account).to receive(:retrieve)
          .and_return(OpenStruct.new({ details_submitted: false }))
        expect(stripe_connected_account.details_submitted).to be(false)
      end

      it "returns true" do
        allow(Stripe::Account).to receive(:retrieve)
          .and_return(OpenStruct.new({ details_submitted: true }))
        expect(stripe_connected_account.details_submitted).to be(true)
      end
    end

    describe "#url" do
      it "returns non nil url" do
        allow(Stripe::AccountLink).to receive(:create)
          .and_return(OpenStruct.new({ url: "https://connect.stripe.com/setup/s/something" }))
        allow(Stripe::Account).to receive(:retrieve)
          .and_return(OpenStruct.new({ details_submitted: false }))
        expect(stripe_connected_account.url).to be("https://connect.stripe.com/setup/s/something")
      end

      it "returns nil" do
        allow(Stripe::AccountLink).to receive(:create)
          .and_return(OpenStruct.new({ url: "https://connect.stripe.com/setup/s/something" }))
        allow(Stripe::Account).to receive(:retrieve)
          .and_return(OpenStruct.new({ details_submitted: true }))
        expect(stripe_connected_account.url).to be(nil)
      end
    end
  end
end
