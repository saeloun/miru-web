# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Mobile::CurrentTimers", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
    sign_in user
  end

  it "returns the persisted mobile timer using the shared timer store" do
    create(
      :desktop_current_timer,
      company:,
      user:,
      current_timer: {
        billable: true,
        elapsed_ms: 120_000,
        notes: "Mobile QA",
        project_name: "Miru / Mobile",
        running: true,
        task_name: "Testing"
      }
    )

    send_request :get, api_v1_mobile_current_timer_path, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response["current_timer"]).to include(
      "billable" => true,
      "elapsed_ms" => 120_000,
      "notes" => "Mobile QA",
      "project_name" => "Miru / Mobile",
      "running" => true,
      "task_name" => "Testing"
    )
  end

  it "updates the shared timer store" do
    send_request :put, api_v1_mobile_current_timer_path, params: {
      current_timer: {
        billable: "true",
        elapsed_ms: 300_000,
        notes: "Implement mobile timer",
        project_name: "Miru / Mobile",
        running: "false",
        task_name: "Development"
      }
    }, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(DesktopCurrentTimer.find_by(user:, company:).current_timer).to include(
      "billable" => true,
      "elapsed_ms" => 300_000,
      "notes" => "Implement mobile timer",
      "running" => false
    )
  end
end
