# frozen_string_literal: true

require "rails_helper"

RSpec.describe SsoEnforcement do
  let(:company) { create(:company, allowed_sso_domains: ["saeloun.com"]) }
  let(:user) { create(:user, email: "member@example.com", current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
  end

  it "uses the same domain restriction for OAuth sign-in" do
    expect(described_class.new(user).oauth_error).to eq(described_class::DOMAIN_NOT_ALLOWED_MESSAGE)
  end

  it "exempts an owner from the domain restriction" do
    user.remove_role :employee, company
    user.add_role :owner, company

    expect(described_class.new(user).oauth_error).to be_nil
  end
end
