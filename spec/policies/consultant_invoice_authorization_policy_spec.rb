# frozen_string_literal: true

require "rails_helper"

RSpec.describe ConsultantInvoiceAuthorizationPolicy do
  include_context "approved mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  before do
    worker.update!(current_workspace: company)
    employment.update!(joined_at: "2020-01-01")
  end

  it "limits fresh grants to the configured active self, without proxy power for admins" do
    expect(described_class.new(worker, employment).grant?).to be(true)
    expect(described_class.new(owner, employment).show?).to be(true)
    expect(described_class.new(owner, employment).record?).to be(false)
    future = create(:employment, company:, user: create(:user, current_workspace: company), joined_at: "2026-12-06", resigned_at: nil)
    expect(described_class.new(future.user, future).grant?).to be(false)
    employment.update!(resigned_at: "2026-11-30")
    expect(described_class.new(worker, employment).grant?).to be(false)
  end

  it "does not expose coworker history to unassigned bookkeepers, staff or foreign workspaces" do
    reader = create(:user, current_workspace: company)
    create(:employment, company:, user: reader, joined_at: "2020-01-01", resigned_at: nil)
    reader.add_role(:book_keeper, company)
    expect(described_class.new(reader, employment).show?).to be(false)
    reader.add_role(:manager, company)
    expect(described_class.new(reader, employment).record?).to be(false)
    owner.update!(current_workspace: create(:company))
    expect(described_class.new(owner, employment).show?).to be(false)
  end

  it "denies discarded subjects and actors even when an old object remains in memory" do
    worker.update!(discarded_at: Time.current)
    expect(described_class.new(worker, employment).show?).to be(false)
    expect(described_class.new(owner, employment).show?).to be(false)
    expect(described_class.new(worker, employment).record?).to be(false)
  end
end
