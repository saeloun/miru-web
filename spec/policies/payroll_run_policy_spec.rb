# frozen_string_literal: true

require "rails_helper"

RSpec.describe PayrollRunPolicy do
  include_context "persisted synthetic payroll review"

  before { run }

  it "reads roles freshly even when the caller holds a previously cached role" do
    expect(owner.has_cached_role?(:owner, company)).to be(true)
    owner.remove_role(:owner, company)
    expect(described_class.new(owner, run).show?).to be(false)
    expect(described_class::Scope.new(owner, PayrollRun).resolve).to be_empty
  end

  it "rejects a stale object whose persisted workspace changed" do
    stale_owner = User.find(owner.id)
    owner.update!(current_workspace: create(:company))
    expect(described_class.new(stale_owner, run).show?).to be(false)
  end

  it "rejects stale kept and employment state" do
    owner.update!(discarded_at: Time.current)
    expect(described_class.new(owner, run).show?).to be(false)
    owner.update!(discarded_at: nil)
    owner.employments.find_by!(company:).update_columns(discarded_at: Time.current)
    expect(described_class.new(owner, run).show?).to be(false)
  end

  it "permits an assigned accounts reviewer and every active owner in that company" do
    expect(described_class.new(accounts, run).show?).to be(true)
    expect(described_class.new(owner, run).show?).to be(true)
  end

  it "pins scope to the authenticated workspace if the persisted workspace changes after eligibility" do
    other_company = create(:company)
    other_accounts = create(:user, current_workspace: other_company)
    other_owner = create(:user, current_workspace: other_company)
    [other_accounts, other_owner].each { |user| create(:employment, company: other_company, user:, resigned_at: nil) }
    other_accounts.add_role(:book_keeper, other_company)
    other_owner.add_role(:owner, other_company)
    other_run = PayrollRun.create!(company: other_company, period: run.period, currency: "INR",
      accounts_reviewer: other_accounts, final_reviewer: other_owner)
    create(:employment, company: other_company, user: owner, resigned_at: Date.yesterday)
    owner.add_role(:owner, other_company)
    allow_any_instance_of(described_class).to receive(:index?).and_wrap_original do |original|
      eligible = original.call
      owner.update_columns(current_workspace_id: other_company.id)
      eligible
    end
    ids = described_class::Scope.new(owner, PayrollRun).resolve.pluck(:id)
    expect(ids - [run.id]).to be_empty
    expect(ids).not_to include(other_run.id)
  end

  it "keeps role and employment lookups pinned after the user object workspace is mutated" do
    policy = described_class.new(owner, run)
    expect(policy.index?).to be(true)
    owner.update!(current_workspace: create(:company))
    expect(policy.workspace_id).to eq(company.id)
    expect(policy.active_member?).to be(false)
    expect(policy.roles.pluck(:resource_id)).to all(eq(company.id))
  end
end
