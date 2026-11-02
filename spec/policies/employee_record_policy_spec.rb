# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmployeeRecordPolicy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user:, joined_at: nil, resigned_at: nil) }
  let(:policy) { described_class.new(user, EmployeeRecord) }

  before { user.add_role(:employee, company) }

  it "allows each kept staff role with an unknown start and native payroll disabled" do
    allow(Payroll::Entitlement).to receive(:enabled?).and_return(false)
    described_class::STAFF_ROLES.each do |role|
      user.roles.clear
      user.add_role(role, company)
      expect(policy.index?).to be(true), role
    end
  end

  it "rejects future, former, discarded, client and foreign-workspace actors and targets" do
    target = create(:user, current_workspace: company)
    target.add_role(:employee, company)
    target_employment = create(:employment, company:, user: target, joined_at: nil, resigned_at: nil)
    user.add_role(:admin, company)
    target_policy = described_class.new(user, target_employment)
    expect(target_policy.show?).to be(true)
    [[user, employment], [target, target_employment]].each do |member, membership|
      [{ joined_at: Date.tomorrow }, { resigned_at: Date.yesterday }, { discarded_at: Time.current }].each do |attributes|
        membership.update_columns(attributes)
        expect(target_policy.show?).to be(false), attributes.inspect
        membership.update_columns(joined_at: nil, resigned_at: nil, discarded_at: nil)
      end
      member.update_column(:discarded_at, Time.current)
      expect(target_policy.show?).to be(false)
      member.update_column(:discarded_at, nil)
      roles = member.roles.to_a
      member.roles.clear
      member.add_role(:client, company)
      expect(target_policy.show?).to be(false)
      member.roles = roles
    end
    employment.update_column(:company_id, create(:company).id)
    expect(policy.index?).to be(false)
    expect(target_policy.show?).to be(false)
  end

  it "keeps today's resignation active and never grants coworkers access to one another" do
    employment.update_column(:resigned_at, Date.current)
    expect(policy.index?).to be(true)
    coworker = create(:user, current_workspace: company)
    coworker.add_role(:employee, company)
    other = create(:employment, company:, user: coworker, joined_at: nil, resigned_at: nil)
    expect(described_class.new(user, other).show?).to be(false)
  end
end
