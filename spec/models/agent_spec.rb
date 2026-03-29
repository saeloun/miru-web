# frozen_string_literal: true

require "rails_helper"

RSpec.describe Agent, type: :model do
  describe "validations" do
    it "requires the backing user to belong to the same company" do
      company = create(:company)
      outsider_company = create(:company)
      outsider = create(:user, current_workspace_id: outsider_company.id)
      create(:employment, company: outsider_company, user: outsider)

      agent = build(:agent, company:, user: outsider)

      expect(agent).not_to be_valid
      expect(agent.errors[:user]).to include("must belong to the same company")
    end

    it "requires the default project to belong to the same company" do
      company = create(:company)
      outsider_company = create(:company)
      user = create(:user, current_workspace_id: company.id)
      outsider_client = create(:client, company: outsider_company)
      outsider_project = create(:project, client: outsider_client)

      create(:employment, company:, user:)

      agent = build(:agent, company:, user:, default_project: outsider_project)

      expect(agent).not_to be_valid
      expect(agent.errors[:default_project]).to include("must belong to the same company")
    end
  end
end
