# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectMembersPresenter do
  describe "#project_to_member_hourly_rate" do
    it "returns hourly rates scoped per project" do
      company = create(:company)
      client = create(:client, company:)
      project_one = create(:project, client:)
      project_two = create(:project, client:)
      user_one = create(:user, current_workspace_id: company.id)
      user_two = create(:user, current_workspace_id: company.id)

      create(:project_member, project: project_one, user: user_one, hourly_rate: 20)
      create(:project_member, project: project_two, user: user_two, hourly_rate: 35)

      rates_by_project = described_class
        .new(Project.where(id: [project_one.id, project_two.id]))
        .project_to_member_hourly_rate

      expect(rates_by_project[project_one.id][user_one.id]).to eq(20)
      expect(rates_by_project[project_two.id][user_two.id]).to eq(35)
      expect(rates_by_project[project_two.id]).not_to eq(rates_by_project[project_one.id])
    end
  end
end
