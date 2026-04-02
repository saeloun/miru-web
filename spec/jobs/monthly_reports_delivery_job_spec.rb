# frozen_string_literal: true

require "rails_helper"

RSpec.describe MonthlyReportsDeliveryJob, type: :job do
  describe "#perform" do
    it "runs the delivery service when the digest env flag is enabled" do
      service = instance_double(MonthlyReportsDeliveryService, process: true)

      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("ENABLE_MONTHLY_REPORT_DIGEST").and_return("1")
      allow(MonthlyReportsDeliveryService).to receive(:new).and_return(service)

      described_class.perform_now

      expect(MonthlyReportsDeliveryService).to have_received(:new)
      expect(service).to have_received(:process)
    end

    it "does not run the delivery service when the digest env flag is disabled" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("ENABLE_MONTHLY_REPORT_DIGEST").and_return(nil)
      allow(MonthlyReportsDeliveryService).to receive(:new)

      described_class.perform_now

      expect(MonthlyReportsDeliveryService).not_to have_received(:new)
    end
  end
end
