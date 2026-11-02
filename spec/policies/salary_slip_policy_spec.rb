# frozen_string_literal: true

require "rails_helper"

RSpec.describe SalarySlipPolicy do
  it "uses the authenticated workspace context independently of the persisted default" do
    company = create(:company)
    default_company = create(:company)
    owner = create(:user, current_workspace: default_company)
    create(:employment, company:, user: owner, resigned_at: nil, joined_at: nil)
    owner.add_role(:owner, company)
    owner.current_workspace = company
    policy = described_class.new(owner, SalarySlip)
    expect(policy.index?).to be(true)
    expect(policy.create?).to be(true)
    expect(owner.reload.current_workspace).to eq(default_company)
    expect(described_class.new(owner, SalarySlip).index?).to be(false)
  end
end
