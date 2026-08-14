# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::GrowthMetricsService do
  around do |example|
    travel_to(Time.zone.local(2026, 8, 12, 12)) { example.run }
  end

  let!(:inactive_company) { create(:company, name: "Inactive workspace") }
  let!(:engaged_company) do
    create(
      :company,
      name: "Engaged workspace",
      trial_started_at: 2.days.ago,
      trial_ends_at: 3.days.from_now
    )
  end
  let!(:paid_company) do
    create(
      :company,
      name: "Paid workspace",
      plan_tier: "paid",
      trial_started_at: 20.days.ago,
      trial_ends_at: 2.days.ago,
      billing_exempt: true
    )
  end

  let!(:engaged_client) { create(:client, company: engaged_company) }
  let!(:paid_client) { create(:client, company: paid_company) }
  let!(:engaged_user) { create(:user, current_workspace: engaged_company) }
  let!(:paid_users) { create_list(:user, 2, current_workspace: paid_company) }
  let!(:paid_invoice) { create(:invoice, company: paid_company, client: paid_client) }

  before do
    create(:employment, company: engaged_company, user: engaged_user)
    paid_users.each { |user| create(:employment, company: paid_company, user:) }
    create(:timesheet_entry, project: create(:project, client: engaged_client), user: engaged_user)
    create(:payment, invoice: paid_invoice)
  end

  it "reports funnel, trial, and workspace activity metrics" do
    metrics = described_class.process

    expect(metrics[:activation_funnel]).to eq(
      total: 3,
      with_client: 2,
      with_activity: 2,
      with_invoice: 1,
      with_payment: 1
    )
    expect(metrics[:trials]).to eq(
      active: 1,
      ending_within_7_days: 1,
      expired: 0,
      converted: 1
    )
    expect(metrics[:top_workspaces].pluck(:name)).to eq([
      "Paid workspace",
      "Engaged workspace",
      "Inactive workspace"
    ])
    expect(metrics[:top_workspaces].first).to include(
      activity_score: 2,
      users_count: 2,
      billing_exempt: true
    )
  end

  it "ignores discarded clients, invoices, and employments" do
    discarded_only = create(:company, name: "Discarded only")
    discarded_client = create(:client, company: discarded_only)
    create(:invoice, company: discarded_only, client: discarded_client).discard!
    discarded_client.discard!
    ghost = create(:user, current_workspace: engaged_company)
    create(:employment, company: engaged_company, user: ghost).discard!

    metrics = described_class.process

    expect(metrics[:activation_funnel]).to include(total: 4, with_client: 2, with_invoice: 1)
    engaged_row = metrics[:top_workspaces].find { |workspace| workspace[:name] == "Engaged workspace" }
    expect(engaged_row[:users_count]).to eq(1)
  end

  it "reports signup trend, weekly active usage, and checkout events" do
    create(:company, name: "Last week signup", created_at: 8.days.ago)
    Ahoy::Event.create!(
      visit: Ahoy::Visit.create!(started_at: 1.day.ago),
      user_id: engaged_user.id, name: "user_login", time: 1.day.ago, properties: {}
    )
    Ahoy::Event.create!(
      visit: Ahoy::Visit.create!(started_at: 2.days.ago),
      user_id: paid_users.first.id, name: "subscription_checkout_started", time: 2.days.ago, properties: {}
    )
    Ahoy::Event.create!(
      visit: Ahoy::Visit.create!(started_at: 20.days.ago),
      user_id: paid_users.first.id, name: "subscription_purchased", time: 20.days.ago, properties: {}
    )

    metrics = described_class.process

    current_week = metrics[:signups][:weeks].first
    previous_week = metrics[:signups][:weeks].second
    expect(current_week[:companies]).to eq(3)
    expect(previous_week[:companies]).to eq(1)
    expect(metrics[:signups][:totals][:companies]).to eq(4)

    expect(metrics[:weekly_active]).to eq(companies: 2, users: 1)

    expect(metrics[:checkouts]).to eq(
      last_7_days: { started: 1, purchased: 0 },
      last_30_days: { started: 1, purchased: 1 }
    )
  end
end
