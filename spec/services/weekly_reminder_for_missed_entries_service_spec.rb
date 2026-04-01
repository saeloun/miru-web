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

      create(
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

      expect(service).to have_received(:check_entries_and_send_mail).with(eligible_user, company)
      expect(service).not_to have_received(:check_entries_and_send_mail).with(unsubscribed_user, company)
    end
  end
end
