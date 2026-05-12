# frozen_string_literal: true

# == Schema Information
#
# Table name: payments_providers
#
#  id                       :bigint           not null, primary key
#  accepted_payment_methods :string           default([]), is an Array
#  connected                :boolean          default(FALSE)
#  enabled                  :boolean          default(FALSE)
#  name                     :string           not null
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  company_id               :bigint           not null
#
# Indexes
#
#  index_payments_providers_on_company_id           (company_id)
#  index_payments_providers_on_connected            (connected)
#  index_payments_providers_on_enabled              (enabled)
#  index_payments_providers_on_name_and_company_id  (name,company_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require "rails_helper"

RSpec.describe PaymentsProvider, type: :model do
  subject { build(:payments_provider) }

  describe "Validations" do
    describe "uniqueness" do
      it { is_expected.to validate_uniqueness_of(:name).scoped_to(:company_id) }
    end

    describe "inclusion" do
      it { is_expected.to validate_inclusion_of(:name).in_array(%w(stripe upi razorpay)) }
    end

    context "when UPI is configured" do
      subject(:provider) do
        build(
          :payments_provider,
          name: PaymentsProvider::UPI_PROVIDER,
          enabled: true,
          settings: { upi_id: upi_id }
        )
      end

      context "with a valid UPI ID" do
        let(:upi_id) { "saeloun@upi" }

        it { is_expected.to be_valid }
      end

      context "with an email address" do
        let(:upi_id) { "syeda.sanaharmain@gmail.com" }

        it "rejects it as an invalid UPI ID" do
          expect(provider).not_to be_valid
          expect(provider.errors[:upi_id]).to be_present
        end
      end
    end

    context "when Razorpay is enabled" do
      subject(:provider) do
        build(:payments_provider, name: PaymentsProvider::RAZORPAY_PROVIDER, enabled: true)
      end

      it "requires API credentials" do
        expect(provider).not_to be_valid
        expect(provider.errors[:base]).to include("Razorpay key id and key secret are required")
      end

      it "requires a linked account when Route transfers are enabled" do
        provider.key_id = "rzp_test_123"
        provider.key_secret = "secret"
        provider.route_transfers_enabled = true

        expect(provider).not_to be_valid
        expect(provider.errors[:linked_account_id]).to be_present
      end

      it "defaults the platform fee to 5%" do
        provider.key_id = "rzp_test_123"
        provider.key_secret = "secret"

        expect(provider).to be_valid
        expect(provider.platform_fee_percent).to eq("5.0")
        expect(provider.payout_purpose).to eq("payout")
      end

      it "rejects invalid platform fees" do
        provider.key_id = "rzp_test_123"
        provider.key_secret = "secret"
        provider.platform_fee_percent = "invalid"

        expect(provider).not_to be_valid
        expect(provider.errors[:platform_fee_percent]).to be_present
      end

      it "encrypts API and webhook secrets" do
        provider.key_id = "rzp_test_123"
        provider.key_secret = "secret"
        provider.webhook_secret = "webhook_secret"

        expect(provider).to be_valid
        expect(provider.settings["key_secret"]).to be_nil
        expect(provider.settings["webhook_secret"]).to be_nil
        expect(provider.settings["key_secret_ciphertext"]).to be_present
        expect(provider.settings["webhook_secret_ciphertext"]).to be_present
      end

      it "keeps encrypted secrets when blank values are assigned" do
        provider.key_id = "rzp_test_123"
        provider.key_secret = "secret"
        provider.webhook_secret = "webhook_secret"
        key_secret_ciphertext = provider.settings["key_secret_ciphertext"]
        webhook_secret_ciphertext = provider.settings["webhook_secret_ciphertext"]

        provider.key_secret = ""
        provider.webhook_secret = nil

        expect(provider.key_secret).to eq("secret")
        expect(provider.webhook_secret).to eq("webhook_secret")
        expect(provider.settings["key_secret_ciphertext"]).to eq(key_secret_ciphertext)
        expect(provider.settings["webhook_secret_ciphertext"]).to eq(webhook_secret_ciphertext)
      end

      it "requires RazorpayX account and UPI ID when UPI payouts are enabled" do
        provider.key_id = "rzp_test_123"
        provider.key_secret = "secret"
        provider.payouts_enabled = true

        expect(provider).not_to be_valid
        expect(provider.errors[:payout_account_number]).to be_present
        expect(provider.errors[:payout_upi_id]).to be_present
      end
    end
  end

  describe "Associations" do
    describe "belongs_to" do
      it { is_expected.to belong_to(:company) }
    end
  end
end
