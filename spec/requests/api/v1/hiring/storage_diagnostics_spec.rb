# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring private-storage diagnostics", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:mailbox) { HiringMailbox.create!(company:, name: "Applications", source_email: "hello@example.test") }
  let(:receipt) do
    source = Mail.new(from: "candidate@example.test", to: "hello@example.test", subject: "Synthetic application", body: "Private candidate body").encoded
    Hiring::ReceiveEmail.new(mailbox:, source:).process
  end

  before do
    admin.add_role(:admin, company)
    sign_in admin
  end

  [HiringSubmission::StorageUnavailable, IOError, Errno::EIO].each do |error_class|
    it "reports #{error_class} with a request reference while withholding private storage details" do
      record = receipt
      private_message = "/private/candidate@example.test/resume.pdf PRIVATE_TOKEN"
      allow_any_instance_of(ActiveStorage::Service::DiskService).to receive(:download).and_raise(error_class, private_message)
      allow(Rails.logger).to receive(:warn)

      get "/api/v1/hiring/receipts/#{record.id}/source", params: { company_id: company.id },
        headers: { "X-Request-Id" => "synthetic-storage-reference" }

      expect(response).to have_http_status(:service_unavailable)
      expect(response.parsed_body).to eq("errors" => "Private hiring storage is unavailable. Please try again.")
      expect(response.headers["Cache-Control"]).to include("private", "no-store")
      expect(Rails.logger).to have_received(:warn).with(
        "[Hiring storage] unavailable error_class=#{error_class.name} request_id=synthetic-storage-reference").once
      expect(response.body).not_to include(private_message, "PRIVATE_TOKEN", "candidate@example.test")
    end
  end
end
