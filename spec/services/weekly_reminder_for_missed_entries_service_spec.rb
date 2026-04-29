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

    it "does not send reminder when previous week exceeds the expected weekly hours" do
      travel_to Time.zone.local(2026, 4, 20, 14, 0, 0) do
        monday_previous_week = Date.new(2026, 4, 13)

        [0, 1, 2, 3, 4].each do |offset|
          project = create(:project, client: create(:client, company:))
          create(
            :timesheet_entry,
            user:,
            project:,
            duration: 540,
            work_date: monday_previous_week + offset.days
          )
        end

        service.check_entries_and_send_mail(user, company, notification_preference)
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

    it "ignores time off from other workspaces when checking weekly totals" do
      travel_to Time.zone.local(2026, 4, 6, 14, 0, 0) do
        other_company = create(:company)
        other_leave = create(:leave, company: other_company, year: 2026)
        other_leave_type = create(:leave_type, leave: other_leave)

        create(
          :timeoff_entry,
          user:,
          leave_type: other_leave_type,
          duration: 2400,
          leave_date: Date.new(2026, 3, 30)
        )

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

    it "does not send reminder when legacy hourly durations meet weekly target" do
      travel_to Time.zone.local(2026, 4, 6, 14, 0, 0) do
        monday_previous_week = Date.new(2026, 3, 30)

        [0, 1, 2, 3, 4].each do |offset|
          project = create(:project, client: create(:client, company:))
          create(
            :timesheet_entry,
            user:,
            project:,
            duration: 9.0,
            work_date: monday_previous_week + offset.days
          )
        end

        service.check_entries_and_send_mail(user, company, notification_preference)
      end

      expect(service).not_to have_received(:send_mail)
    end

    it "does not send reminder when legacy hourly durations are split across many entries" do
      travel_to Time.zone.local(2026, 4, 6, 14, 0, 0) do
        monday_previous_week = Date.new(2026, 3, 30)
        project = create(:project, client: create(:client, company:))

        10.times do |index|
          create(
            :timesheet_entry,
            user:,
            project:,
            duration: 4.5,
            work_date: monday_previous_week + (index % 5).days
          )
        end

        service.check_entries_and_send_mail(user, company, notification_preference)
      end

      expect(service).not_to have_received(:send_mail)
    end

    it "still sends reminder for minute granularity entries below weekly target" do
      travel_to Time.zone.local(2026, 4, 6, 14, 0, 0) do
        monday_previous_week = Date.new(2026, 3, 30)
        project = create(:project, client: create(:client, company:))

        10.times do |index|
          create(
            :timesheet_entry,
            user:,
            project:,
            duration: 15,
            work_date: monday_previous_week + (index % 5).days
          )
        end

        service.check_entries_and_send_mail(user, company, notification_preference)
      end

      expect(service).to have_received(:send_mail).once
    end

    it "sends reminder when legacy hourly durations are still below weekly target" do
      travel_to Time.zone.local(2026, 4, 6, 14, 0, 0) do
        monday_previous_week = Date.new(2026, 3, 30)

        [0, 1, 2].each do |offset|
          project = create(:project, client: create(:client, company:))
          create(
            :timesheet_entry,
            user:,
            project:,
            duration: 7.5,
            work_date: monday_previous_week + offset.days
          )
        end

        service.check_entries_and_send_mail(user, company, notification_preference)
      end

      expect(service).to have_received(:send_mail).once
    end
  end
end
