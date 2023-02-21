# frozen_string_literal: true

require "rails_helper"
require "zip"

RSpec.describe PaymentProviders::CreateStripeProviderService do
  let(:company) { create(:company) }

  describe "#process" do
    context "when stripe account is connected" do
      before do
        # While running specs, we don't want url and to access url, we need to set ActiveStorage url
        allow_any_instance_of(Company).to receive(:stripe_connected_account).and_return({ a: 1 })
        allow_any_instance_of(StripeConnectedAccount).to receive(:details_submitted).and_return(true)

        described_class.new(company).process
      end

      it "checks if" do
        expect(PaymentsProvider.count).to eq(1)
      end
    end
  end
end
