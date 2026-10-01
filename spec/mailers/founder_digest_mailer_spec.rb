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
      weekly_active: { companies: 9, other_record_companies: 7, imported_time_entry_companies: 4, users: 11 },
      trials: { active: 4, ending_within_7_days: 2, expired: 6, converted: 3 },
      checkouts: {
        last_7_days: { started: 7, purchased: 2 },
        last_30_days: { started: 18, purchased: 6 }
      },
      top_workspaces: [{
        name: "Acme", activity_score: 14, imported_time_entries_count: 9, other_records_count: 5,
        users_count: 3, billing_exempt: false
      }]
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
    [mail.html_part, mail.text_part].each do |part|
      body = part.body.decoded
      expect(body).to include(
        "Workspaces with records created", "Paid-tier trial workspaces", "Purchase events",
        "14 records", "9 imported time entries", "5 other records", "not paid invoices or MRR"
      )
      expect(body).not_to include("Converted trials", "Converted to paid", "14 actions")
    end
  end

  it "marks import breakdowns unavailable for digests queued before the breakdown existed" do
    metrics[:weekly_active].except!(:other_record_companies, :imported_time_entry_companies)
    metrics[:top_workspaces].first.except!(:imported_time_entries_count, :other_records_count)

    mail = described_class.with(recipient: "founder@example.com", metrics:).weekly

    [mail.html_part, mail.text_part].each do |part|
      expect(part.body.decoded).to include("Import breakdown unavailable")
      expect(part.body.decoded).not_to include("0 imported time entries", "0 other records")
    end
  end
end
