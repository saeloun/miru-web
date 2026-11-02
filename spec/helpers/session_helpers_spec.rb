# frozen_string_literal: true

require "rails_helper"

RSpec.describe SessionHelpers do
  include SessionHelpers

  it "keeps an explicitly assigned company admin role when preparing a local test login" do
    company = create(:company)
    user = create(:user, current_workspace: company)
    create(:employment, company:, user:, resigned_at: nil)
    user.add_role(:admin, company)
    ensure_user_setup(user)
    expect(user.roles.where(resource: company).pluck(:name)).to eq(["admin"])
  end

  it "does not substitute a role held only in a different workspace" do
    company = create(:company)
    other = create(:company)
    user = create(:user, current_workspace: company)
    create(:employment, company:, user:, resigned_at: nil)
    user.add_role(:admin, other)
    ensure_user_setup(user)
    expect(user.roles.where(resource: company).pluck(:name)).to eq(["employee"])
    expect(user.roles.where(resource: other).pluck(:name)).to eq(["admin"])
  end
end
