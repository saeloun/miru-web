# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Health check", type: :request do
  describe "GET /health" do
    it "returns healthy when the database responds" do
      get "/health"

      expect(response).to have_http_status(:ok)
      expect(json_response["status"]).to eq("healthy")
      expect(json_response["timestamp"]).to be_present
    end

    it "returns service unavailable and logs when the database check fails" do
      connection = ActiveRecord::Base.connection

      allow(connection).to receive(:execute).with("SELECT 1").and_raise(StandardError, "database unavailable")
      allow(Rails.logger).to receive(:error)

      get "/health"

      expect(response).to have_http_status(:service_unavailable)
      expect(json_response["status"]).to eq("unhealthy")
      expect(json_response["timestamp"]).to be_present
      expect(Rails.logger).to have_received(:error).with("Health check database failed: database unavailable")
    end
  end
end
