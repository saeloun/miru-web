# frozen_string_literal: true

require "rails_helper"

RSpec.describe UpdateExchangeRatesJob, type: :job do
  describe "#perform" do
    let(:fetch_service) { instance_double(ExchangeRates::FetchService) }

    before do
      allow(ExchangeRates::FetchService).to receive(:new).with(auto_discover: true).and_return(fetch_service)
    end

    context "when fetch is successful without discovery" do
      before do
        allow(fetch_service).to receive(:process).and_return(
          { success: true, rates_updated: 170, usage: 2.5 }
        )
      end

      it "calls the fetch service with auto_discover enabled" do
        described_class.perform_now
        expect(ExchangeRates::FetchService).to have_received(:new).with(auto_discover: true)
      end

      it "logs success message" do
        allow(Rails.logger).to receive(:info)
        described_class.perform_now
        expect(Rails.logger).to have_received(:info).with(/Exchange rates updated successfully/)
      end

      it "logs rates updated count" do
        allow(Rails.logger).to receive(:info)
        described_class.perform_now
        expect(Rails.logger).to have_received(:info).with(/Your pairs updated: 170/)
      end

      it "logs usage percentage" do
        allow(Rails.logger).to receive(:info)
        described_class.perform_now
        expect(Rails.logger).to have_received(:info).with(/Usage: 2.5%/)
      end
    end

    context "when fetch is successful with discovery results" do
      before do
        allow(fetch_service).to receive(:process).and_return(
          {
            success: true,
            rates_updated: 170,
            usage: 2.5,
            discovery: {
              discovered_pairs: [["EUR", "USD"], ["GBP", "USD"]],
              total_pairs: 4,
              activated: 3,
              deactivated: 1
            }
          }
        )
      end

      it "logs discovery statistics" do
        allow(Rails.logger).to receive(:info)
        described_class.perform_now
        expect(Rails.logger).to have_received(:info).with(/Pairs discovered: 4/)
      end

      it "logs activated pairs count" do
        allow(Rails.logger).to receive(:info)
        described_class.perform_now
        expect(Rails.logger).to have_received(:info).with(/3 activated/)
      end

      it "logs deactivated pairs count" do
        allow(Rails.logger).to receive(:info)
        described_class.perform_now
        expect(Rails.logger).to have_received(:info).with(/1 deactivated/)
      end

      it "includes all information in single log message" do
        allow(Rails.logger).to receive(:info)
        described_class.perform_now
        expect(Rails.logger).to have_received(:info).with(
          /Exchange rates updated successfully.*Your pairs updated: 170.*Usage: 2.5%.*Pairs discovered: 4.*3 activated.*1 deactivated/
        )
      end
    end

    context "when fetch fails" do
      before do
        allow(fetch_service).to receive(:process).and_return(
          { success: false, error: "API request failed: 429" }
        )
      end

      it "logs error message" do
        allow(Rails.logger).to receive(:error)
        described_class.perform_now
        expect(Rails.logger).to have_received(:error).with(/Failed to update exchange rates/)
      end

      it "logs the error details" do
        allow(Rails.logger).to receive(:error)
        described_class.perform_now
        expect(Rails.logger).to have_received(:error).with(/API request failed: 429/)
      end

      it "does not raise an exception" do
        expect {
          described_class.perform_now
        }.not_to raise_error
      end
    end

    it "is enqueued in the default queue" do
      expect(described_class.new.queue_name).to eq("default")
    end
  end
end
