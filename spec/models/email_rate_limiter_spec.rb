# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmailRateLimiter, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
  end

  describe "attributes" do
    let(:user) { create(:user) }
    let(:email_rate_limiter) { create(:email_rate_limiter, user:) }

    it "has correct attributes" do
      expect(email_rate_limiter).to have_attributes(
        user_id: user.id,
        number_of_emails_sent: 0
      )
    end

    it "tracks number of emails sent" do
      email_rate_limiter.update(number_of_emails_sent: 5)
      expect(email_rate_limiter.number_of_emails_sent).to eq(5)
    end

    it "tracks current interval started at" do
      timestamp = Time.current
      email_rate_limiter.update(current_interval_started_at: timestamp)
      expect(email_rate_limiter.current_interval_started_at).to be_within(1.second).of(timestamp)
    end
  end
end
