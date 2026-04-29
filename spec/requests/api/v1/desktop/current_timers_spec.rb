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

    it "does not return a timer from another workspace" do
      other_company = create(:company)
      create(:employment, company: other_company, user:)
      create(
        :desktop_current_timer,
        company: other_company,
        user:,
        current_timer: {
          elapsed_ms: 999_000,
          notes: "Other workspace timer",
          running: true
        }
      )

      send_request :get, api_v1_desktop_current_timer_path

      expect(response).to have_http_status(:ok)
      expect(json_response["current_timer"]).to include(
        "elapsed_ms" => 0,
        "notes" => "",
        "running" => false
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

    it "persists a shared web timer deck for MiruTime handoff" do
      send_request :put, api_v1_desktop_current_timer_path, params: {
        current_timer: {
          billable: false,
          elapsed_ms: 120_000,
          notes: "Review shared timer sync",
          project_name: "Miru / Web timers",
          running: true,
          source: "web",
          started_at: "2026-04-29T13:30:00.000Z",
          synced_at: "2026-04-29T13:35:00.000Z",
          task_name: "Review shared timer sync",
          timer_deck: {
            activeTimerId: "timer-web-1",
            version: 2,
            timers: [
              {
                client: "Miru",
                description: "Review shared timer sync",
                elapsedTime: 120_000,
                id: "timer-web-1",
                isRunning: true,
                project: "Web timers",
                projectId: 42,
                startTime: 1_777_468_200_000
              }
            ]
          }
        }
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["current_timer"]).to include(
        "elapsed_ms" => 120_000,
        "notes" => "Review shared timer sync",
        "source" => "web",
        "synced_at" => "2026-04-29T13:35:00.000Z"
      )
      expect(json_response.dig("current_timer", "timer_deck")).to include(
        "activeTimerId" => "timer-web-1",
        "version" => 2
      )
      expect(json_response.dig("current_timer", "timer_deck", "timers").first).to include(
        "description" => "Review shared timer sync",
        "id" => "timer-web-1",
        "isRunning" => true,
        "project" => "Web timers",
        "projectId" => 42
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

    it "sanitizes invalid and oversized timer payload values" do
      send_request :put, api_v1_desktop_current_timer_path, params: {
        current_timer: {
          billable: "1",
          elapsed_ms: -10_000,
          notes: "n" * 2_100,
          project_name: "p" * 250,
          running: "0",
          started_at: "not a timestamp",
          task_name: "t" * 140,
          ignored: "not persisted"
        }
      }

      expect(response).to have_http_status(:ok)
      timer = json_response["current_timer"]
      expect(timer["billable"]).to be(true)
      expect(timer["elapsed_ms"]).to eq(0)
      expect(timer["notes"].length).to eq(2_000)
      expect(timer["project_name"].length).to eq(200)
      expect(timer["running"]).to be(false)
      expect(timer["started_at"]).to be_nil
      expect(timer["task_name"].length).to eq(120)
      expect(timer).not_to have_key("ignored")
    end

    it "sanitizes oversized shared timer decks" do
      send_request :put, api_v1_desktop_current_timer_path, params: {
        current_timer: {
          elapsed_ms: 90_000,
          timer_deck: {
            activeTimerId: "missing",
            version: 2,
            timers: [
              {
                client: "c" * 250,
                description: "d" * 2_100,
                elapsedTime: -1,
                extra: "ignored",
                id: "timer-1",
                isRunning: "1",
                project: "p" * 250,
                projectId: -20,
                startTime: -1
              }
            ]
          }
        }
      }

      timer_deck = json_response.dig("current_timer", "timer_deck")
      deck_timer = timer_deck["timers"].first

      expect(response).to have_http_status(:ok)
      expect(timer_deck["activeTimerId"]).to eq("timer-1")
      expect(deck_timer["client"].length).to eq(200)
      expect(deck_timer["description"].length).to eq(2_000)
      expect(deck_timer["elapsedTime"]).to eq(0)
      expect(deck_timer["isRunning"]).to be(true)
      expect(deck_timer["project"].length).to eq(200)
      expect(deck_timer["projectId"]).to eq(0)
      expect(deck_timer["startTime"]).to eq(0)
      expect(deck_timer).not_to have_key("extra")
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
