# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin growth analytics" do
  let(:metrics) do
    {
      signups: {
        weeks: [{ week_start: Date.new(2026, 8, 10), companies: 2, users: 4 }],
        totals: { companies: 10, users: 20 }
      },
      activation_funnel: { total: 10, with_client: 8, with_activity: 6, with_invoice: 4, with_payment: 2 },
      weekly_active: { companies: 5, users: 7 },
      trials: { active: 3, ending_within_7_days: 1, expired: 4, converted: 2 },
      checkouts: {
        last_7_days: { started: 4, purchased: 1 },
        last_30_days: { started: 12, purchased: 5 }
      },
      top_workspaces: [{
        name: "Acme",
        users_count: 3,
        activity_score: 14,
        last_activity_at: Time.zone.local(2026, 8, 13),
        billing_exempt: false
      }]
    }
  end

  before do
    allow(Analytics::GrowthMetricsService).to receive(:process).and_return(metrics)
  end

  it "renders the report for a super admin" do
    sign_in create(:user, email: User.super_admin_emails.first, confirmed_at: Time.current)

    get "/admin/growth"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Miru growth analytics", "Activation funnel", "Top workspaces", "Acme")
  end

  it "does not render the report for a regular user" do
    sign_in create(:user)

    get "/admin/growth", headers: { "ACCEPT" => "application/json" }

    expect(response).to have_http_status(:ok)
    expect(response.body).not_to include("Miru growth analytics")
    expect(Analytics::GrowthMetricsService).not_to have_received(:process)
  end
end
