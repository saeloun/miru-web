# frozen_string_literal: true

require "rails_helper"

RSpec.describe WeeklyReminderForMissedEntriesService do
  describe "#process" do
    it "skips users who are unsubscribed from weekly reminders" do
      company = create(:company)
      eligible_user = create(:user, current_workspace_id: company.id)
      unsubscribed_user = create(:user, current_workspace_id: company.id)

      create(:employment, company:, user: eligible_user)
      create(:employment, company:, user: unsubscribed_user)
      eligible_user.add_role :employee, company
      unsubscribed_user.add_role :employee, company

      eligible_preference = create(
        :notification_preference,
        :all_enabled,
        user: eligible_user,
        company:
      )
      create(
        :notification_preference,
        :all_enabled,
        :unsubscribed,
        user: unsubscribed_user,
        company:
      )

      service = described_class.new
      allow(service).to receive(:check_entries_and_send_mail)

      service.process

      expect(service).to have_received(:check_entries_and_send_mail).with(eligible_user, company, eligible_preference)
      expect(service).not_to have_received(:check_entries_and_send_mail).with(unsubscribed_user, company)
    end
  end

  describe "#check_entries_and_send_mail" do
    let(:company) { create(:company, working_hours: "40") }
    let(:user) { create(:user, current_workspace_id: company.id) }
    let(:notification_preference) { create(:notification_preference, :all_enabled, user:, company:) }
    let(:service) { described_class.new }

    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      allow(service).to receive(:send_mail)
    end

    it "does not send reminder when previous week spans months and total is complete" do
      travel_to Time.zone.local(2026, 4, 6, 14, 0, 0) do
        monday_previous_week = Date.new(2026, 3, 30)

        [0, 1, 2, 3, 4].each do |offset|
          project = create(:project, client: create(:client, company:))
          create(
            :timesheet_entry,
            user:,
            project:,
            duration: 480,
            work_date: monday_previous_week + offset.days
          )
        end

        service.check_entries_and_send_mail(user, company)
      end

      expect(service).not_to have_received(:send_mail)
    end

    it "sends reminder when previous week total is below the expected weekly hours" do
      travel_to Time.zone.local(2026, 4, 6, 14, 0, 0) do
        monday_previous_week = Date.new(2026, 3, 30)

        [0, 1, 2].each do |offset|
          project = create(:project, client: create(:client, company:))
          create(
            :timesheet_entry,
            user:,
            project:,
            duration: 480,
            work_date: monday_previous_week + offset.days
          )
        end

        service.check_entries_and_send_mail(user, company, notification_preference)
      end

      expect(service).to have_received(:send_mail).once
    end

    it "sends at most one reminder per user/company for a given week" do
      travel_to Time.zone.local(2026, 4, 6, 14, 0, 0) do
        monday_previous_week = Date.new(2026, 3, 30)

        [0, 1, 2].each do |offset|
          project = create(:project, client: create(:client, company:))
          create(
            :timesheet_entry,
            user:,
            project:,
            duration: 480,
            work_date: monday_previous_week + offset.days
          )
        end

        2.times do
          service.check_entries_and_send_mail(user, company, notification_preference)
        end
      end

      expect(service).to have_received(:send_mail).once
      expect(notification_preference.reload.weekly_reminder_last_sent_for_week_start).to eq(Date.new(2026, 3, 30))
    end
  end
end
