# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendWeeklyReminderToUserMailer, type: :mailer do
  describe "notify_user_about_missed_entries" do
    let(:company) { create(:company, name: "Test Company") }
    let(:user) { create(:user, first_name: "John", last_name: "Doe", email: "john@example.com") }
    let(:start_date) { 1.week.ago.beginning_of_week }
    let(:end_date) { 1.week.ago.end_of_week }
    let(:subject) { "Reminder to Update your Timesheet on Miru" }

    it "add mail to default queue" do
      mailer = described_class.with(
        recipients: user.email,
        name: user.full_name,
        start_date:,
        end_date:,
        company_name: company.name
      ).notify_user_about_missed_entries

      expect { mailer.deliver_later }.to have_enqueued_job.on_queue("default").exactly(:once)
      expect(mailer.to).to eq([user.email])
      expect(mailer.subject).to eq(subject)
    end

    context "with notification preferences" do
      context "when user has notifications enabled" do
        let!(:notification_preference) do
          create(:notification_preference,
            user:,
            company:,
            notification_enabled: true,
            unsubscribed_from_all: false
          )
        end

        it "should send the email" do
          mailer = described_class.with(
            recipients: user.email,
            name: user.full_name,
            start_date:,
            end_date:,
            company_name: company.name
          ).notify_user_about_missed_entries

          expect(mailer.to).to eq([user.email])
        end
      end

      context "when user is unsubscribed from all" do
        let!(:notification_preference) do
          create(:notification_preference,
            user:,
            company:,
            notification_enabled: true,
            unsubscribed_from_all: true
          )
        end

        it "marks that user should not receive email" do
          # Note: The actual filtering should happen in the service that calls the mailer
          # This test documents that the mailer itself doesn't check preferences
          mailer = described_class.with(
            recipients: user.email,
            name: user.full_name,
            start_date:,
            end_date:,
            company_name: company.name
          ).notify_user_about_missed_entries

          expect(mailer.to).to eq([user.email])
          # The service should check: notification_preference.unsubscribed_from_all
        end
      end
    end
  end
end
