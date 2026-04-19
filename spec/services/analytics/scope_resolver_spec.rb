# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::ScopeResolver do
  let(:company) { create(:company) }
  let(:manager) { create(:user, current_workspace_id: company.id) }
  let(:managed_user) { create(:user, current_workspace_id: company.id) }
  let(:other_user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:other_client) { create(:client, company:) }
  let(:project) { create(:project, client:, billable: true) }
  let(:other_project) { create(:project, client: other_client, billable: true) }

  before do
    manager.add_role :manager, company
    create(:employment, company:, user: manager)
    create(:employment, company:, user: managed_user)
    create(:employment, company:, user: other_user)
    create(:project_member, user: manager, project: project)
    create(:project_member, user: managed_user, project: project)
    create(:project_member, user: other_user, project: other_project)
  end

  it "derives manager scope from project memberships" do
    result = described_class.new(user: manager, company: company).process

    expect(result[:role]).to eq("manager")
    expect(result[:project_ids]).to eq([project.id])
    expect(result[:client_ids]).to eq([client.id])
    expect(result[:user_ids]).to match_array([manager.id, managed_user.id])
  end
end
