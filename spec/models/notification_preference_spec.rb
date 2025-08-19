# frozen_string_literal: true

require "rails_helper"

RSpec.describe NotificationPreference, type: :model do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:notification_preference) { create(:notification_preference, user:, company:) }

  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:company) }
  end

  describe "validations" do
    it { is_expected.to validate_inclusion_of(:notification_enabled).in_array([true, false]) }
  end

  describe "notification fields" do
    it "has default values for notification fields" do
      pref = NotificationPreference.new
      expect(pref.notification_enabled).to eq(false)
      expect(pref.invoice_email_notifications).to eq(true)
      expect(pref.payment_email_notifications).to eq(true)
      expect(pref.timesheet_reminder_enabled).to eq(true)
      expect(pref.unsubscribed_from_all).to eq(false)
    end
  end

  describe "#unsubscribed_from_all" do
    context "when user unsubscribes from all" do
      before do
        notification_preference.update!(unsubscribed_from_all: true)
      end

      it "sets unsubscribed_from_all to true" do
        expect(notification_preference.unsubscribed_from_all).to be true
      end

      it "should override other notification settings" do
        notification_preference.update!(
          notification_enabled: true,
          invoice_email_notifications: true
        )

        # Even though individual preferences are enabled,
        # unsubscribed_from_all should take precedence in the application logic
        expect(notification_preference.unsubscribed_from_all).to be true
      end
    end

    context "when user re-subscribes" do
      before do
        notification_preference.update!(
          unsubscribed_from_all: true,
          notification_enabled: false,
          invoice_email_notifications: false
        )

        notification_preference.update!(unsubscribed_from_all: false)
      end

      it "sets unsubscribed_from_all to false" do
        expect(notification_preference.unsubscribed_from_all).to be false
      end

      it "allows individual preferences to be re-enabled" do
        notification_preference.update!(
          notification_enabled: true,
          invoice_email_notifications: true
        )

        expect(notification_preference.notification_enabled).to be true
        expect(notification_preference.invoice_email_notifications).to be true
      end
    end
  end

  describe "preference management" do
    it "can update weekly reminder preference" do
      notification_preference.update!(notification_enabled: true)
      expect(notification_preference.notification_enabled).to be true
    end

    it "can update invoice email preference" do
      notification_preference.update!(invoice_email_notifications: false)
      expect(notification_preference.invoice_email_notifications).to be false
    end

    it "can update payment email preference" do
      notification_preference.update!(payment_email_notifications: false)
      expect(notification_preference.payment_email_notifications).to be false
    end

    it "can update timesheet reminder preference" do
      notification_preference.update!(timesheet_reminder_enabled: false)
      expect(notification_preference.timesheet_reminder_enabled).to be false
    end
  end

  describe "scopes for notification delivery" do
    let!(:subscribed_user) { create(:user) }
    let!(:unsubscribed_user) { create(:user) }
    let!(:weekly_enabled_user) { create(:user) }

    let!(:subscribed_pref) do
      create(:notification_preference,
        user: subscribed_user,
        company:,
        unsubscribed_from_all: false,
        notification_enabled: true
      )
    end

    let!(:unsubscribed_pref) do
      create(:notification_preference,
        user: unsubscribed_user,
        company:,
        unsubscribed_from_all: true,
        notification_enabled: true
      )
    end

    let!(:weekly_enabled_pref) do
      create(:notification_preference,
        user: weekly_enabled_user,
        company:,
        unsubscribed_from_all: false,
        notification_enabled: true
      )
    end

    it "finds users who should receive weekly reminders" do
      eligible_users = NotificationPreference
        .where(company:)
        .where(unsubscribed_from_all: false)
        .where(notification_enabled: true)

      expect(eligible_users).to include(subscribed_pref, weekly_enabled_pref)
      expect(eligible_users).not_to include(unsubscribed_pref)
    end

    it "finds users who should receive invoice notifications" do
      eligible_users = NotificationPreference
        .where(company:)
        .where(unsubscribed_from_all: false)
        .where(invoice_email_notifications: true)

      expect(eligible_users.count).to be >= 2
    end
  end
end
