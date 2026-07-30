# frozen_string_literal: true

require "rails_helper"

RSpec.describe CreateCompanyService do
  describe "#process" do
    let(:user) { create(:user) }
    let(:company_params) { attributes_for(:company, name: "Launch Co") }

    it "creates the company, ownership, and notification preference" do
      company = described_class.new(user, params: company_params).process

      expect(company).to be_persisted
      expect(company.name).to eq("Launch Co")
      expect(user.reload.current_workspace_id).to eq(company.id)
      expect(user.has_role?(:owner, company)).to be(true)
      expect(NotificationPreference.find_by(user_id: user.id, company_id: company.id)).to be_present
    end

    it "starts the 14-day pro trial for the new company" do
      travel_to(Time.zone.local(2026, 7, 14, 12, 0, 0)) do
        company = nil
        expect do
          company = described_class.new(user, params: company_params).process
        end.to change { Ahoy::Event.where(name: "trial_started").count }.by(1)

        expect(company.trial_started_at).to eq(Time.current)
        expect(company.trial_ends_at).to eq(14.days.from_now)
        expect(company.trial_active?).to be(true)
        expect(company.pro_access?).to be(true)
        expect(Ahoy::Event.where(name: "trial_started").last.properties).to include(
          "company_id" => company.id,
          "user_id" => user.id,
          "source" => "organization_setup"
        )
      end
    end

    it "sends the trial started email to the creator when billing is configured" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID").and_return("price_test_123")

      expect { described_class.new(user, params: company_params).process }
        .to have_enqueued_mail(SubscriptionMailer, :trial_started)
    end

    it "starts the trial without an email when Stripe billing is not configured" do
      allow(TrialEmailsJob).to receive(:billing_configured?).and_return(false)

      company = nil
      expect { company = described_class.new(user, params: company_params).process }
        .not_to have_enqueued_mail(SubscriptionMailer, :trial_started)

      expect(company.trial_active?).to be(true)
    end
  end
end
