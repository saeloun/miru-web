# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendWeeklyReminderToUserMailer, type: :mailer do
  describe "notify_user_about_missed_entries" do
    let(:user) { create(:user) }
    let(:start_date) { 1.week.ago.beginning_of_week }
    let(:end_date) { 1.week.ago.end_of_week }
    let(:subject) { "Missed time entries report for the week ending on #{end_date}" }

    it "add mail to default queue" do
      mailer = described_class.with(
        recipients: user.email,
        name: user.full_name,
        start_date:,
        end_date:,
      ).notify_user_about_missed_entries

      expect { mailer.deliver_later }.to have_enqueued_job.on_queue("default").exactly(:once)
      expect(mailer.to).to eq([user.email])
      expect(mailer.subject).to eq(subject)
    end
  end
end
