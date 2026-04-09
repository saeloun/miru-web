# frozen_string_literal: true

# == Schema Information
#
# Table name: employments
#
#  id              :bigint           not null, primary key
#  designation     :string
#  discarded_at    :datetime
#  employment_type :string
#  joined_at       :date
#  resigned_at     :date
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  company_id      :bigint           not null
#  employee_id     :string
#  user_id         :bigint           not null
#
# Indexes
#
#  index_employments_on_company_id    (company_id)
#  index_employments_on_discarded_at  (discarded_at)
#  index_employments_on_user_id       (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
require "rails_helper"

RSpec.describe Employment, type: :model do
  let(:employment) { create(:employment) }
  let(:company) { employment.company }
  let(:user) { employment.user }

  describe "Associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:user) }
  end

  describe "Discard" do
    it "discards the employments" do
      expect { employment.discard! }.to change(company.employments.discarded, :count).by(1)
      expect(employment.reload.discarded?).to be_truthy
      expect(user.reload.employments.discarded.count).to eq(1)
    end

    it "unsubscribes the user's notification preference for the discarded company" do
      preference = create(
        :notification_preference,
        user:,
        company:,
        unsubscribed_from_all: false
      )

      employment.discard!

      expect(preference.reload.unsubscribed_from_all).to be(true)
    end

    it "does not rewrite an already unsubscribed notification preference" do
      preference = create(
        :notification_preference,
        user:,
        company:,
        unsubscribed_from_all: true
      )

      expect { employment.discard! }.not_to change { preference.reload.updated_at }
    end

    it "moves the current workspace to another kept employment when one exists" do
      other_company = create(:company)
      other_employment = create(:employment, user:, company: other_company)
      user.update!(current_workspace: company)

      employment.discard!

      expect(other_employment.reload).to be_kept
      expect(user.reload.current_workspace_id).to eq(other_company.id)
    end

    it "keeps the current workspace unchanged when no other kept employment exists" do
      user.update!(current_workspace: company)

      employment.discard!

      expect(user.reload.current_workspace_id).to eq(company.id)
    end

    it "does not discard the employments if already discarded" do
      employment.discard!
      expect { employment.discard! }.to raise_error(Discard::RecordNotDiscarded)
    end

    it "resubscribes notification preferences when the employment is restored" do
      preference = create(
        :notification_preference,
        user:,
        company:,
        unsubscribed_from_all: false,
        notification_enabled: false,
        invoice_email_notifications: false,
        payment_email_notifications: false,
        timesheet_reminder_enabled: false,
        monthly_report_digest_enabled: false
      )

      employment.discard!
      employment.undiscard!

      expect(preference.reload.unsubscribed_from_all).to be(false)
      expect(preference.notification_enabled).to be(true)
      expect(preference.invoice_email_notifications).to be(true)
      expect(preference.payment_email_notifications).to be(true)
      expect(preference.timesheet_reminder_enabled).to be(true)
      expect(preference.monthly_report_digest_enabled).to be(true)
    end
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:designation).on(:update) }
    it { is_expected.to validate_presence_of(:employment_type).on(:update) }
    it { is_expected.to validate_presence_of(:joined_at).on(:update) }
    it { is_expected.to validate_presence_of(:employee_id).on(:update) }
  end

  describe "validate comparisons" do
    it "joining date should not be after than resigned_at date" do
      expect(employment.joined_at).to be <= employment.resigned_at
    end

    context "when joined_at is in the future" do
      it "is not valid and returns an error message" do
        employment.assign_attributes(
          joined_at: Date.tomorrow,
          designation: "Developer",
          employment_type: "Full-time",
          employee_id: "EMP001"
        )
        expect(employment.valid?(:update)).to be false
        expect(employment.errors[:joined_at]).to include("date must be in past")
      end
    end

    context "when updating and joined_at is today" do
      it "is valid" do
        employment.assign_attributes(
          joined_at: Date.current,
          resigned_at: Date.tomorrow,
          designation: "Developer",
          employment_type: "Full-time",
          employee_id: "EMP001"
        )
        expect(employment.valid?(:update)).to be true
        expect(employment.errors[:joined_at]).to be_empty
      end
    end

    context "when updating and joined_at is in the past" do
      it "is valid" do
        employment.assign_attributes(
          joined_at: Date.yesterday,
          resigned_at: Date.current,
          designation: "Developer",
          employment_type: "Full-time",
          employee_id: "EMP001"
        )
        expect(employment.valid?(:update)).to be true
        expect(employment.errors[:joined_at]).to be_empty
      end
    end
  end
end
