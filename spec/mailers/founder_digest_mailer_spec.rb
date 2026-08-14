# frozen_string_literal: true

require "rails_helper"

RSpec.describe FounderDigestMailer do
  let(:metrics) do
    {
      signups: {
        weeks: [{ week_start: Date.new(2026, 8, 10), companies: 3, users: 5 }],
        totals: { companies: 20, users: 40 }
      },
      activation_funnel: { total: 20, with_client: 15, with_activity: 12, with_invoice: 8, with_payment: 5 },
      weekly_active: { companies: 9, users: 11 },
      trials: { active: 4, ending_within_7_days: 2, expired: 6, converted: 3 },
      checkouts: {
        last_7_days: { started: 7, purchased: 2 },
        last_30_days: { started: 18, purchased: 6 }
      },
      top_workspaces: [{ name: "Acme", activity_score: 14, users_count: 3, billing_exempt: false }]
    }
  end

  it "renders the weekly growth digest" do
    mail = described_class.with(
      recipient: "founder@example.com",
      metrics:,
      date: Date.new(2026, 8, 14)
    ).weekly

    expect(mail.subject).to eq("Miru growth digest — August 14, 2026")
    expect(mail.to).to eq(["founder@example.com"])
    expect(mail.html_part.body.encoded).to include("Activation funnel", "Active workspaces", "Acme")
    expect(mail.text_part.body.encoded).to include("ACTIVATION FUNNEL", "Active workspaces: 9", "Acme: 14 actions")
  end
end
