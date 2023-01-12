# frozen_string_literal: true

require "rails_helper"

describe ProjectListService do
  let(:company) { create(:company) }
  let(:client1) { create(:client, company:) }
  let(:client2) { create(:client, company:) }
  let(:project1) { create(:project, client: client1) }
  let(:project2) { create(:project, client: client1) }
  let(:project3) { create(:project, client: client2) }
  let(:project4) { create(:project, client: client2) }

  describe "#process" do
    it "returns all projects" do
      service = ProjectListService.new(company, nil, nil, nil, nil)
      expect(service.process).to eq(company.projects.kept)
    end

    it "returns projects by client" do
      service = ProjectListService.new(company, client1.id, nil, nil, nil)
      expect(service.process).to eq(client1.projects.kept)
    end

    it "returns projects by billable" do
      service = ProjectListService.new(company, nil, nil, true, nil)
      expect(service.process).to eq(company.projects.kept.where(billable: true))
    end

    it "returns projects by search" do
      service = ProjectListService.new(company, nil, nil, nil, project1.name)
      expect(service.process).to eq([project1])
    end

    it "returns projects by user" do
      user = create(:user, current_workspace_id: company.id)
      create(:project_member, user:, project: project1)
      service = ProjectListService.new(company, nil, user.id, nil, nil)
      expect(service.process).to eq([project1])
    end

    it "returns projects by user and client" do
      user = create(:user, current_workspace_id: company.id)
      create(:project_member, user:, project: project1)
      service = ProjectListService.new(company, client1.id, user.id, nil, nil)
      expect(service.process).to eq([project1])
    end

    it "returns projects by user and billable" do
      user = create(:user, current_workspace_id: company.id)
      create(:project_member, user:, project: project1)
      service = ProjectListService.new(company, nil, user.id, true, nil)
      expect(service.process).to eq(user.projects.kept.where(billable: true))
    end

    it "returns projects by user and search" do
      user = create(:user, current_workspace_id: company.id)
      create(:project_member, user:, project: project1)
      service = ProjectListService.new(company, nil, user.id, nil, project1.name)
      expect(service.process).to eq([project1])
    end

    it "returns projects by client and billable" do
      service = ProjectListService.new(company, client1.id, nil, true, nil)
      expect(service.process).to eq(client1.projects.kept.where(billable: true))
    end

    it "returns projects by client and search" do
      service = ProjectListService.new(company, client1.id, nil, nil, project1.name)
      expect(service.process).to eq(client1.projects.kept.where(id: project1.id))
    end
  end
end
