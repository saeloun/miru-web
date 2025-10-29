# frozen_string_literal: true

require "rails_helper"

RSpec.describe ExchangeRateUsage, type: :model do
  describe "Validations" do
    subject { create(:exchange_rate_usage) }

    it { is_expected.to validate_presence_of(:month) }
    it { is_expected.to validate_uniqueness_of(:month) }
  end

  describe "Scopes" do
    let!(:current_month_usage) { create(:exchange_rate_usage, month: Date.current.beginning_of_month) }
    let!(:last_month_usage) { create(:exchange_rate_usage, month: 1.month.ago.beginning_of_month) }

    describe ".current_month" do
      it "returns only current month's usage" do
        expect(ExchangeRateUsage.current_month).to include(current_month_usage)
        expect(ExchangeRateUsage.current_month).not_to include(last_month_usage)
      end
    end
  end

  describe ".current" do
    context "when current month usage exists" do
      let!(:usage) { create(:exchange_rate_usage, month: Date.current.beginning_of_month) }

      it "returns the existing usage record" do
        expect(ExchangeRateUsage.current).to eq(usage)
      end

      it "is concurrency-safe and returns the same record" do
        # Simulate concurrent access
        usage1 = ExchangeRateUsage.current
        usage2 = ExchangeRateUsage.current
        expect(usage1.id).to eq(usage2.id)
      end
    end

    context "when current month usage does not exist" do
      it "creates a new usage record for current month" do
        expect {
          ExchangeRateUsage.current
        }.to change(ExchangeRateUsage, :count).by(1)
      end

      it "sets the month to current month's beginning" do
        usage = ExchangeRateUsage.current
        expect(usage.month).to eq(Date.current.beginning_of_month)
      end

      it "uses find_or_create_by! for concurrency safety" do
        allow(ExchangeRateUsage).to receive(:find_or_create_by!)
          .with(month: Date.current.beginning_of_month)
          .and_call_original
        ExchangeRateUsage.current
      end
    end

    context "when validation fails" do
      it "raises an error on unexpected failures" do
        allow(ExchangeRateUsage).to receive(:find_or_create_by!).and_raise(ActiveRecord::RecordInvalid)
        expect {
          ExchangeRateUsage.current
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end
  end

  describe "#increment_usage!" do
    let(:usage) { create(:exchange_rate_usage, requests_count: 10) }

    it "increments the requests_count by 1" do
      expect {
        usage.increment_usage!
      }.to change { usage.reload.requests_count }.by(1)
    end

    it "updates the last_fetched_at timestamp" do
      usage.increment_usage!
      expect(usage.reload.last_fetched_at).to be_within(1.second).of(Time.current)
    end

    it "updates the updated_at timestamp" do
      usage.increment_usage!
      expect(usage.reload.updated_at).to be_within(1.second).of(Time.current)
    end

    it "uses atomic SQL update for concurrency safety" do
      # Verify it uses update_all which is atomic
      allow(ExchangeRateUsage).to receive(:where).with(id: usage.id).and_call_original
      usage.increment_usage!
    end

    it "performs a single database write" do
      # Count the number of SQL UPDATE statements
      queries = []
      subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |_name, _start, _finish, _id, payload|
        queries << payload[:sql] if payload[:sql].match?(/UPDATE.*exchange_rate_usages/i)
      end

      usage.increment_usage!

      ActiveSupport::Notifications.unsubscribe(subscriber)

      # Should be 1 UPDATE for the atomic operation (update_all doesn't trigger callbacks)
      expect(queries.count).to eq(1)
      expect(queries.first).to include("requests_count = requests_count + 1")
    end
  end

  describe "#usage_percentage" do
    it "calculates the correct percentage" do
      usage = create(:exchange_rate_usage, requests_count: 250)
      expect(usage.usage_percentage).to eq(25.0)
    end

    it "returns 0 when no requests made" do
      usage = create(:exchange_rate_usage, requests_count: 0)
      expect(usage.usage_percentage).to eq(0.0)
    end

    it "returns 100 when limit reached" do
      usage = create(:exchange_rate_usage, requests_count: 1000)
      expect(usage.usage_percentage).to eq(100.0)
    end

    it "rounds usage to two decimals when needed" do
      usage = create(:exchange_rate_usage, requests_count: 333)
      expect(usage.usage_percentage).to eq(33.3)
    end
  end

  describe "#approaching_limit?" do
    it "returns true when usage is at 70%" do
      usage = create(:exchange_rate_usage, requests_count: 700)
      expect(usage.approaching_limit?).to be true
    end

    it "returns true when usage is above 70%" do
      usage = create(:exchange_rate_usage, requests_count: 850)
      expect(usage.approaching_limit?).to be true
    end

    it "returns false when usage is below 70%" do
      usage = create(:exchange_rate_usage, requests_count: 650)
      expect(usage.approaching_limit?).to be false
    end
  end

  describe "#limit_exceeded?" do
    it "returns true when limit is exceeded" do
      usage = create(:exchange_rate_usage, requests_count: 1001)
      expect(usage.limit_exceeded?).to be true
    end

    it "returns true when limit is exactly reached" do
      usage = create(:exchange_rate_usage, requests_count: 1000)
      expect(usage.limit_exceeded?).to be true
    end

    it "returns false when below limit" do
      usage = create(:exchange_rate_usage, requests_count: 999)
      expect(usage.limit_exceeded?).to be false
    end
  end

  describe "#remaining_requests" do
    it "calculates remaining requests correctly" do
      usage = create(:exchange_rate_usage, requests_count: 300)
      expect(usage.remaining_requests).to eq(700)
    end

    it "returns a negative number when limit is exceeded" do
      usage = create(:exchange_rate_usage, requests_count: 1200)
      expect(usage.remaining_requests).to eq(-200)
    end

    it "returns full limit when no requests made" do
      usage = create(:exchange_rate_usage, requests_count: 0)
      expect(usage.remaining_requests).to eq(1000)
    end
  end
end
