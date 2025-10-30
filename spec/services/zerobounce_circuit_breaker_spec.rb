# frozen_string_literal: true

require "rails_helper"

RSpec.describe ZerobounceCircuitBreaker do
  include ActiveSupport::Testing::TimeHelpers
  let(:test_email) { "test@example.com" }

  # Use memory store for testing since test env uses null_store
  around do |example|
    original_cache = Rails.cache
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
    example.run
    Rails.cache = original_cache
  end

  before do
    # Clear circuit breaker state before each test
    described_class.reset!
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("ENABLE_EMAIL_VALIDATION").and_return("true")
  end

  after do
    # Clean up after tests
    described_class.reset!
  end

  describe ".open?" do
    it "returns false when circuit is closed" do
      expect(described_class.open?).to be false
    end

    it "returns true when circuit is open" do
      10.times { described_class.record_failure("Test failure") }
      expect(described_class.open?).to be true
    end
  end

  describe ".execute" do
    context "when circuit is closed and validation is enabled" do
      it "calls Zerobounce API and returns success" do
        mock_response = { "status" => "valid" }
        allow(Zerobounce).to receive(:validate).with(test_email).and_return(mock_response)

        result = described_class.execute(test_email)

        expect(result[:success]).to be true
        expect(result[:response]).to eq(mock_response)
      end

      it "handles timeout errors gracefully" do
        allow(Zerobounce).to receive(:validate).and_raise(Timeout::Error)

        result = described_class.execute(test_email)

        expect(result[:skip]).to be true
        expect(result[:reason]).to include("Timeout")
      end

      it "handles API errors gracefully" do
        allow(Zerobounce).to receive(:validate).and_raise(StandardError.new("API Error"))

        result = described_class.execute(test_email)

        expect(result[:skip]).to be true
        expect(result[:reason]).to include("API error")
      end
    end

    context "when circuit is open" do
      before do
        10.times { described_class.record_failure("Test failure") }
      end

      it "skips validation without calling API" do
        expect(Zerobounce).not_to receive(:validate)

        result = described_class.execute(test_email)

        expect(result[:skip]).to be true
        expect(result[:reason]).to eq("Circuit breaker open")
      end
    end

    context "when validation is disabled" do
      before do
        allow(ENV).to receive(:[]).with("ENABLE_EMAIL_VALIDATION").and_return("false")
      end

      it "skips validation" do
        expect(Zerobounce).not_to receive(:validate)

        result = described_class.execute(test_email)

        expect(result[:skip]).to be true
        expect(result[:reason]).to eq("Email validation disabled")
      end
    end
  end

  describe ".record_failure" do
    it "increments failure count" do
      described_class.record_failure("Error 1")
      status = described_class.status

      expect(status[:failures]).to eq(1)
      expect(status[:state]).to eq("closed")
    end

    it "opens circuit after threshold failures" do
      allow(Rails.logger).to receive(:error)
      allow(AdminAlertMailer).to receive_message_chain(:zerobounce_circuit_open, :deliver_later)

      10.times { |i| described_class.record_failure("Error #{i + 1}") }

      expect(described_class.open?).to be true
      expect(described_class.status[:state]).to eq("open")
    end

    it "only counts failures within time window" do
      # Record old failures (outside 2-hour window)
      travel_to 3.hours.ago do
        5.times { described_class.record_failure("Old error") }
      end

      # Record recent failures
      5.times { described_class.record_failure("Recent error") }

      status = described_class.status
      expect(status[:failures]).to eq(5) # Only recent failures counted
    end
  end

  describe ".record_success" do
    it "clears failure count" do
      5.times { described_class.record_failure("Error") }
      described_class.record_success

      expect(described_class.status[:failures]).to eq(0)
      expect(described_class.status[:state]).to eq("closed")
    end
  end

  describe ".status" do
    it "returns default status when no data exists" do
      status = described_class.status

      expect(status[:state]).to eq("closed")
      expect(status[:failures]).to eq(0)
    end

    it "returns current circuit state" do
      3.times { described_class.record_failure("Error") }
      status = described_class.status

      expect(status[:state]).to eq("closed")
      expect(status[:failures]).to eq(3)
      expect(status[:last_failure]).to be_present
    end
  end

  describe ".reset!" do
    it "clears all circuit breaker data" do
      10.times { described_class.record_failure("Error") }
      expect(described_class.open?).to be true

      described_class.reset!

      expect(described_class.open?).to be false
      expect(described_class.status[:failures]).to eq(0)
    end
  end
end
