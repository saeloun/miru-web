# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::CreateStripeProviderService do
  let(:company) { create(:company) }

  describe "#process" do
    context "when stripe account is connected" do
      it "payment provide is created" do
        stripe_connected_account = StripeConnectedAccount.new
        allow(stripe_connected_account).to receive(:details_submitted).and_return(true)
        allow_any_instance_of(Company).to receive(:stripe_connected_account).and_return(stripe_connected_account)
        allow_any_instance_of(StripeConnectedAccount).to receive(:details_submitted).and_return(true)

        expect { described_class.new(company).process }.to change(PaymentsProvider, :count).by(1)
      end
    end
  end
end
