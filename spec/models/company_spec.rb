# frozen_string_literal: true

# == Schema Information
#
# Table name: companies
#
#  id                  :bigint           not null, primary key
#  address             :text
#  bank_account_number :string
#  bank_name           :string
#  bank_routing_number :string
#  bank_swift_code     :string
#  base_currency       :string           default("USD"), not null
#  business_phone      :string
#  calendar_enabled    :boolean          default(TRUE)
#  country             :string           not null
#  date_format         :string
#  fiscal_year_end     :string
#  gst_number          :string
#  name                :string           not null
#  standard_price      :decimal(, )      default(0.0), not null
#  timezone            :string
#  vat_number          :string
#  working_days        :string           default("5")
#  working_hours       :string           default("40")
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  tax_id              :string
#
require "rails_helper"

RSpec.describe Company, type: :model do
  subject { create(:company) }

  describe "Associations" do
    it { is_expected.to have_many(:users).through(:employments) }
    it { is_expected.to have_many(:employments).dependent(:destroy) }
    it { is_expected.to have_many(:clients).dependent(:destroy) }
    it { is_expected.to have_many(:projects).through(:clients).dependent(:destroy) }
    it { is_expected.to have_one_attached(:logo) }
    it { is_expected.to have_many(:current_workspace_users).dependent(:nullify) }
    it { is_expected.to have_many(:addresses).dependent(:destroy) }
    it { is_expected.to have_many(:devices).dependent(:destroy) }
    it { is_expected.to have_many(:expenses).dependent(:destroy) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:standard_price) }
    it { is_expected.to validate_presence_of(:country) }
    it { is_expected.to validate_presence_of(:base_currency) }
    it { is_expected.to validate_length_of(:name).is_at_most(30) }
    it { is_expected.to validate_length_of(:business_phone).is_at_most(15) }

    it do
      expect(subject).to validate_numericality_of(:standard_price).is_greater_than_or_equal_to(0)
    end

    describe "phone number validation" do
      let(:company) { build(:company) }

      it "accepts valid US phone number" do
        company.business_phone = "+14155552671"
        expect(company).to be_valid
      end

      it "accepts valid Indian phone number" do
        company.business_phone = "+919876543210"
        expect(company).to be_valid
      end

      it "accepts valid UK phone number" do
        company.business_phone = "+442071234567"
        expect(company).to be_valid
      end

      it "accepts blank phone number" do
        company.business_phone = nil
        expect(company).to be_valid
      end

      it "rejects invalid phone number" do
        company.business_phone = "123"
        expect(company).not_to be_valid
        expect(company.errors[:business_phone]).to include("is invalid")
      end

      it "rejects phone number exceeding 15 characters" do
        company.business_phone = "+1234567890123456"
        expect(company).not_to be_valid
        expect(company.errors[:business_phone]).to include("is invalid")
      end
    end
  end

  describe "Public methods" do
    let(:company) { create(:company) }
    let(:user_1) { create(:user) }
    let(:user_2) { create(:user) }
    let(:client_1) { create(:client, company:) }
    let(:client_2) { create(:client, company:) }
    let(:project_1) { create(:project, client: client_1) }
    let(:project_2) { create(:project, client: client_2) }
    let(:params) do
      {
        client_id: nil,
        user_id: nil,
        billable: nil,
        search: nil
      }
    end
    let(:result) do
      [
        {
          clientName: client_1.name, id: project_1.id, isBillable: project_1.billable,
          minutesSpent: project_1.timesheet_entries.sum(:duration), name: project_1.name
        },
        {
          clientName: client_2.name, id: project_2.id, isBillable: project_2.billable,
          minutesSpent: project_2.timesheet_entries.sum(:duration), name: project_2.name
        }
      ]
    end

    before do
      create(:employment, company_id: company.id, user_id: user_1.id)
      create(:employment, company_id: company.id, user_id: user_2.id)
      create(:project_member, user_id: user_1.id, project_id: project_1.id)
      create(:project_member, user_id: user_1.id, project_id: project_2.id)
      create(:project_member, user_id: user_2.id, project_id: project_1.id)
      create(:project_member, user_id: user_2.id, project_id: project_2.id)
      create_list(:timesheet_entry, 5, user: user_1, project: project_1)
      create_list(:timesheet_entry, 5, user: user_1, project: project_2)
      create_list(:timesheet_entry, 5, user: user_2, project: project_1)
      create_list(:timesheet_entry, 5, user: user_2, project: project_2)
    end

    describe "#client_list" do
      it "returns list of all the clients of a company" do
        expect(company.client_list).to match_array [
          a_hash_including(id: client_1.id),
          a_hash_including(id: client_2.id)
        ]
      end
    end

    describe "#overdue_and_outstanding_and_draft_amount" do
      let(:company) do
        create(:company, clients: create_list(:client_with_invoices, 5))
      end
      let(:user) { create(:user, current_workspace_id: company.id) }

      it "return invoice amounts" do
        status_and_amount = company.invoices.kept.group_by(&:status).transform_values { |invoices|
          invoices.sum { |invoice|
            invoice.base_currency_amount.to_f > 0.00 ? invoice.base_currency_amount : invoice.amount
          }
        }
        currency = company.base_currency
        status_and_amount.default = 0
        outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"]
        + status_and_amount["overdue"]
        result = {
          overdue_amount: status_and_amount["overdue"],
          outstanding_amount:,
          draft_amount: status_and_amount["draft"],
          currency:
        }
        expect(company.overdue_and_outstanding_and_draft_amount).to match_array(result)
      end

      context "when invoice is deleted" do
        before do
          create(:invoice, client: company.clients.first, company:, discarded_at: 2.days.ago)
        end

        it "returns only live invoices summary" do
          status_and_amount = company.invoices.kept.group_by(&:status).transform_values { |invoices|
            invoices.sum { |invoice|
              invoice.base_currency_amount.to_f > 0.00 ? invoice.base_currency_amount : invoice.amount
            }
          }
          currency = company.base_currency
          status_and_amount.default = 0
          outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"]
          + status_and_amount["overdue"]
          result = {
            overdue_amount: status_and_amount["overdue"],
            outstanding_amount:,
            draft_amount: status_and_amount["draft"],
            currency:
          }
          expect(company.overdue_and_outstanding_and_draft_amount).to match_array(result)
        end
      end
    end

    describe "#trial_available?" do
      it "is true for a free company that has not used a trial" do
        expect(company.trial_available?).to eq(true)
      end

      it "is false for a paid company" do
        company.update!(plan_tier: "paid")

        expect(company.trial_available?).to eq(false)
      end

      it "is false for a billing exempt company" do
        company.update!(billing_exempt: true)

        expect(company.trial_available?).to eq(false)
      end

      it "is false after the company has used its trial" do
        company.update!(trial_started_at: 31.days.ago, trial_ends_at: 1.day.ago)

        expect(company.trial_available?).to eq(false)
      end
    end

    describe "#pro_access?" do
      it "is true while the trial is active" do
        travel_to(Time.zone.local(2026, 3, 11, 12, 0, 0)) do
          company.update!(trial_started_at: Time.current, trial_ends_at: 30.days.from_now)

          expect(company.pro_access?).to eq(true)
          expect(company.current_plan_label).to eq("pro_trial")
          expect(company.current_subscription_status).to eq("trialing")
          expect(company.team_member_limit).to eq(100)
        end
      end

      it "falls back to free access after the trial ends" do
        travel_to(Time.zone.local(2026, 4, 15, 12, 0, 0)) do
          company.update!(
            trial_started_at: 35.days.ago,
            trial_ends_at: 5.days.ago
          )

          expect(company.pro_access?).to eq(false)
          expect(company.current_subscription_status).to eq("trial_expired")
          expect(company.team_member_limit).to eq(3)
        end
      end

      it "is true for a paid Stripe subscription" do
        company.update!(plan_tier: "paid", subscription_status: "active")

        expect(company.pro_access?).to eq(true)
        expect(company.stripe_subscription_active?).to eq(true)
      end
    end

    describe "#team_member_limit_reached?" do
      it "counts pending non-client invitations against the free limit" do
        create(:employment, company:, user: create(:user, current_workspace_id: company.id))
        create(:invitation, company:, sender: create(:user), role: :client)

        expect(company.used_team_seats).to eq(3)
        expect(company.pending_team_seat_invites).to eq(0)
        expect(company.team_member_limit_reached?).to eq(true)
        expect(company.can_add_team_member_role?("client")).to eq(true)
        expect(company.can_add_team_member_role?("employee")).to eq(false)
      end
    end

    describe "#billable_team_seats" do
      it "returns at least one seat for billing" do
        expect(company.billable_team_seats).to eq([company.used_team_seats, 1].max)
      end

      it "matches the kept employment count when the team grows" do
        baseline = company.used_team_seats
        second_user = create(:user)
        create(:employment, company:, user: second_user)

        expect(company.billable_team_seats).to eq(baseline + 1)
      end
    end

    describe "#client_portal_users_count" do
      let(:team_member) { create(:user, current_workspace_id: company.id) }
      let(:client_portal_user) { create(:user, current_workspace_id: company.id) }
      let(:mixed_role_user) { create(:user, current_workspace_id: company.id) }
      let(:other_company_client) { create(:user, current_workspace_id: company.id) }
      let(:discarded_client_user) { create(:user, current_workspace_id: company.id) }
      let(:other_company) { create(:company) }

      before do
        create(:employment, company:, user: team_member)
        team_member.add_role(:employee, company)

        create(:employment, company:, user: client_portal_user)
        client_portal_user.add_role(:client, company)

        create(:employment, company:, user: mixed_role_user)
        mixed_role_user.add_role(:client, company)
        mixed_role_user.add_role(:employee, company)

        create(:employment, company:, user: other_company_client)
        other_company_client.add_role(:client, other_company)

        create(:employment, company:, user: discarded_client_user, discarded_at: Time.current)
        discarded_client_user.add_role(:client, company)
      end

      it "counts kept users whose only company role is client" do
        expect(company.client_portal_users_count).to eq(1)
      end

      it "excludes only client portal users from employee lists" do
        expect(company.employees_without_client_role).to include(team_member, mixed_role_user, other_company_client)
        expect(company.employees_without_client_role).not_to include(client_portal_user, discarded_client_user)
      end
    end

    describe "#apply_stripe_subscription!" do
      it "marks the company as paid for active subscriptions" do
        company.apply_stripe_subscription!(
          stripe_customer_id: "cus_123",
          stripe_subscription_id: "sub_123",
          subscription_status: "active",
          subscription_ends_at: Time.zone.local(2026, 4, 10, 12, 0, 0),
          subscription_interval: "month"
        )

        company.reload

        expect(company.plan_tier).to eq("paid")
        expect(company.stripe_customer_id).to eq("cus_123")
        expect(company.stripe_subscription_id).to eq("sub_123")
        expect(company.subscription_status).to eq("active")
        expect(company.subscription_interval).to eq("month")
      end

      it "marks the company as free for canceled subscriptions" do
        company.apply_stripe_subscription!(
          stripe_customer_id: "cus_123",
          stripe_subscription_id: "sub_123",
          subscription_status: "canceled",
          subscription_interval: "year"
        )

        expect(company.reload.plan_tier).to eq("free")
      end
    end

    describe "#revoke_stripe_subscription_access!" do
      it "clears paid access while preserving trial history" do
        company.update!(
          plan_tier: "paid",
          stripe_customer_id: "cus_123",
          stripe_subscription_id: "sub_123",
          subscription_status: "active",
          subscription_interval: "month"
        )

        company.revoke_stripe_subscription_access!
        company.reload

        expect(company.plan_tier).to eq("free")
        expect(company.subscription_status).to eq("canceled")
        expect(company.subscription_ends_at).to be_nil
        expect(company.stripe_subscription_id).to be_nil
        expect(company.subscription_interval).to be_nil
      end
    end
  end
end
