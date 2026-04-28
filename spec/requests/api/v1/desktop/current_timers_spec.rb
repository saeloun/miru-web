# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Desktop::CurrentTimers", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    sign_in user
  end

  describe "GET /api/v1/desktop/current_timer" do
    it "returns an empty current timer when one has not been synced" do
      send_request :get, api_v1_desktop_current_timer_path

      expect(response).to have_http_status(:ok)
      expect(json_response["current_timer"]).to include(
        "billable" => false,
        "elapsed_ms" => 0,
        "notes" => "",
        "running" => false
      )
    end

    it "returns the current user's timer for the active workspace" do
      create(
        :desktop_current_timer,
        company:,
        user:,
        current_timer: {
          billable: false,
          elapsed_ms: 123_000,
          notes: "Synced from desktop",
          project_name: "Northstar / Platform redesign",
          running: true,
          started_at: "2026-04-28T15:30:00.000Z",
          task_name: "Development"
        }
      )

      send_request :get, api_v1_desktop_current_timer_path

      expect(response).to have_http_status(:ok)
      expect(json_response["current_timer"]).to include(
        "billable" => false,
        "elapsed_ms" => 123_000,
        "notes" => "Synced from desktop",
        "project_name" => "Northstar / Platform redesign",
        "running" => true,
        "task_name" => "Development"
      )
    end
  end

  describe "PUT /api/v1/desktop/current_timer" do
    it "persists the current timer for the user and active workspace" do
      send_request :put, api_v1_desktop_current_timer_path, params: {
        current_timer: {
          billable: "false",
          elapsed_ms: 456_000,
          notes: "Build desktop timer sync",
          project_name: "Miru / Desktop",
          running: "true",
          started_at: "2026-04-28T15:30:00.000Z",
          task_name: "Development"
        }
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["current_timer"]).to include(
        "billable" => false,
        "elapsed_ms" => 456_000,
        "notes" => "Build desktop timer sync",
        "project_name" => "Miru / Desktop",
        "running" => true,
        "task_name" => "Development"
      )

      expect(DesktopCurrentTimer.find_by(user:, company:).current_timer).to include(
        "elapsed_ms" => 456_000,
        "notes" => "Build desktop timer sync"
      )
    end

    it "updates the existing current timer" do
      create(:desktop_current_timer, company:, user:, current_timer: { elapsed_ms: 30_000 })

      send_request :put, api_v1_desktop_current_timer_path, params: {
        current_timer: {
          billable: true,
          elapsed_ms: 90_000,
          notes: "Updated",
          project_name: "Miru / Desktop",
          running: false,
          task_name: "Review"
        }
      }

      expect(response).to have_http_status(:ok)
      expect(DesktopCurrentTimer.where(user:, company:).count).to eq(1)
      expect(json_response["current_timer"]).to include(
        "elapsed_ms" => 90_000,
        "notes" => "Updated",
        "running" => false
      )
    end

    it "does not allow unauthenticated sync" do
      sign_out user

      send_request :put, api_v1_desktop_current_timer_path, params: {
        current_timer: { elapsed_ms: 90_000 }
      }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
