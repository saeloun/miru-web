# frozen_string_literal: true

require "rails_helper"

RSpec.describe ApplicationMailer, type: :mailer do
  let(:user) { create(:user) }
  let(:email_rate_limiter) { create(:email_rate_limiter, user:) }
  let(:mailer) { ApplicationMailer.new }

  before do
    allow(mailer).to receive(:params).and_return({ current_user_id: user.id })
    allow(mailer).to receive(:current_user).and_return(user)
    allow(user).to receive(:email_rate_limiter).and_return(email_rate_limiter)
  end

  describe "#email_within_rate_limit" do
    context "when email_rate_limiter is nil" do
      before { allow(user).to receive(:email_rate_limiter).and_return(nil) }

      it "returns nil" do
        expect(mailer.email_within_rate_limit).to be_nil
      end
    end

    context "when current_user is nil" do
      before do
        allow(mailer).to receive(:current_user).and_return(nil)
        allow(mailer).to receive(:email_rate_limiter).and_return(nil)
      end

      it "returns nil" do
        expect(mailer.email_within_rate_limit).to be_nil
      end
    end

    context "when rate is not within time limit" do
      before do
        allow(mailer).to receive(:rate_within_time_limit).and_return(false)
      end

      it "returns true" do
        expect(mailer.email_within_rate_limit).to be true
      end
    end

    context "when rate is within time limit" do
      before do
        allow(mailer).to receive(:rate_within_time_limit).and_return(true)
      end

      context "when email count is within limit" do
        before do
          allow(mailer).to receive(:email_sent_within_limit).and_return(true)
        end

        it "returns true" do
          expect(mailer.email_within_rate_limit).to be true
        end
      end

      context "when email count exceeds limit" do
        before do
          allow(mailer).to receive(:email_sent_within_limit).and_return(false)
        end

        it "returns false" do
          expect(mailer.email_within_rate_limit).to be false
        end
      end
    end
  end

  describe "#raise_email_limit_crossed_error" do
    context "when email is within rate limit" do
      before { allow(mailer).to receive(:email_within_rate_limit).and_return(true) }

      it "does not raise error" do
        expect { mailer.raise_email_limit_crossed_error }.not_to raise_error
      end
    end

    context "when email exceeds rate limit" do
      before { allow(mailer).to receive(:email_within_rate_limit).and_return(false) }

      it "raises error" do
        expect { mailer.raise_email_limit_crossed_error }.to raise_error("Email Limit crossed")
      end
    end
  end

  describe "#update_email_rate_limiter" do
    context "when rate is within time limit" do
      before do
        allow(mailer).to receive(:rate_within_time_limit).and_return(true)
      end

      context "when current_interval_started_at is nil" do
        before do
          email_rate_limiter.update(current_interval_started_at: nil, number_of_emails_sent: 0)
        end

        it "sets current_interval_started_at and increments email count" do
          mailer.update_email_rate_limiter
          email_rate_limiter.reload
          expect(email_rate_limiter.current_interval_started_at).to be_within(2.seconds).of(Time.current)
          expect(email_rate_limiter.number_of_emails_sent).to eq(1)
        end
      end

      context "when current_interval_started_at is set" do
        before do
          email_rate_limiter.update(
            current_interval_started_at: 1.minute.ago,
            number_of_emails_sent: 2
          )
        end

        it "increments email count" do
          mailer.update_email_rate_limiter
          email_rate_limiter.reload
          expect(email_rate_limiter.number_of_emails_sent).to eq(3)
        end
      end
    end

    context "when rate is not within time limit" do
      before do
        allow(mailer).to receive(:rate_within_time_limit).and_return(false)
      end

      it "resets the rate limiter" do
        email_rate_limiter.update(number_of_emails_sent: 5)
        mailer.update_email_rate_limiter
        email_rate_limiter.reload
        expect(email_rate_limiter.number_of_emails_sent).to eq(1)
        expect(email_rate_limiter.current_interval_started_at).to be_within(2.seconds).of(Time.current)
      end
    end
  end

  describe "#rate_within_time_limit" do
    context "when current_interval_started_at is nil" do
      before { email_rate_limiter.update(current_interval_started_at: nil) }

      it "returns falsey" do
        expect(mailer.rate_within_time_limit).to be_falsey
      end
    end

    context "when interval has not expired" do
      before do
        Setting.interval_unit = :min
        Setting.interval_length = 5
        email_rate_limiter.update(current_interval_started_at: 2.minutes.ago)
      end

      it "returns true" do
        expect(mailer.rate_within_time_limit).to be true
      end
    end

    context "when interval has expired" do
      before do
        Setting.interval_unit = :min
        Setting.interval_length = 5
        email_rate_limiter.update(current_interval_started_at: 10.minutes.ago)
      end

      it "returns false" do
        expect(mailer.rate_within_time_limit).to be false
      end
    end
  end

  describe "#email_sent_within_limit" do
    before { Setting.number_of_email = 5 }

    context "when emails sent is less than limit" do
      before { email_rate_limiter.update(number_of_emails_sent: 3) }

      it "returns true" do
        expect(mailer.email_sent_within_limit).to be true
      end
    end

    context "when emails sent equals limit" do
      before { email_rate_limiter.update(number_of_emails_sent: 5) }

      it "returns false" do
        expect(mailer.email_sent_within_limit).to be false
      end
    end

    context "when emails sent exceeds limit" do
      before { email_rate_limiter.update(number_of_emails_sent: 6) }

      it "returns false" do
        expect(mailer.email_sent_within_limit).to be false
      end
    end
  end
end
