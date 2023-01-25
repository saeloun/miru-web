# frozen_string_literal: true

require "rails_helper"

describe Projects::SearchService do
  let(:company) { create(:company) }
  let(:client1) { create(:client, company:) }
  let(:client2) { create(:client, company:) }
  let(:project1) { create(:project, client: client1) }
  let(:project2) { create(:project, client: client1) }
  let(:project3) { create(:project, client: client2) }
  let(:project4) { create(:project, client: client2) }

  describe "#process" do
    it "returns all projects" do
      service = Projects::SearchService.new(nil, company, nil, nil, nil)
      expect(service.process).to eq(company.projects.kept)
    end

    it "returns projects by client" do
      service = Projects::SearchService.new(nil, company, client1.id, nil, nil)
      expect(service.process).to eq(client1.projects.kept)
    end

    it "returns projects by billable" do
      service = Projects::SearchService.new(nil, company, nil, nil, true)
      expect(service.process).to eq(company.projects.kept.where(billable: true))
    end

    it "returns projects by search" do
      service = Projects::SearchService.new(project1.name, company, nil, nil, nil)
      expect(service.process).to eq([project1])
    end

    it "returns projects by user" do
      user = create(:user, current_workspace_id: company.id)
      create(:project_member, user:, project: project1)
      service = Projects::SearchService.new(nil, company, nil, user.id, nil)
      expect(service.process).to eq([project1])
    end

    it "returns projects by user and client" do
      user = create(:user, current_workspace_id: company.id)
      create(:project_member, user:, project: project1)
      service = Projects::SearchService.new(nil, company, client1.id, user.id, nil)
      expect(service.process).to eq([project1])
    end

    it "returns projects by user and billable" do
      user = create(:user, current_workspace_id: company.id)
      create(:project_member, user:, project: project1)
      service = Projects::SearchService.new(nil, company, nil, user.id, true)
      expect(service.process).to eq([project1])
    end

    it "returns projects by user and search" do
      user = create(:user, current_workspace_id: company.id)
      create(:project_member, user:, project: project1)
      service = Projects::SearchService.new(project1.name, company, nil, user.id, nil)
      expect(service.process).to eq([project1])
    end

    it "returns projects by client and billable" do
      service = Projects::SearchService.new(nil, company, client1.id, nil, true)
      expect(service.process).to eq(client1.projects.kept.where(billable: true))
    end

    it "returns projects by client and search" do
      service = Projects::SearchService.new(project1.name, company, client1.id, nil, nil)
      expect(service.process).to eq(client1.projects.kept.where(id: project1.id))
    end
  end
end
