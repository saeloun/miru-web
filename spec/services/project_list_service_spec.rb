# frozen_string_literal: true

require "rails_helper"

describe ProjectListService do
  before do
    @company = create(:company)
    @project1 = create(:project, company: @company)
    @project2 = create(:project, company: @company)
    @project3 = create(:project, company: @company)
    @project4 = create(:project, company: @company)
    @service = ProjectListService.new(@company, nil, nil, nil, nil)
  end

  describe "#process" do
    subject { company.project_list(*params.values) }

    context "when no filters or search are applied" do
      it "returns list of all projects" do
        expect(subject).to match_array(result)
      end
    end

    context "when Search with project name" do
      before { params[:search] = project_1.name }

      it "returns projects with names matching search" do
        expect(subject).to match_array(result)
      end
    end

    context "when Search with client name" do
      before { params[:search] = client_1.name }

      let(:result) do
        [{
          clientName: client_1.name, id: project_1.id, isBillable: project_1.billable,
          minutesSpent: project_1.timesheet_entries.sum(:duration), name: project_1.name
        }]
      end

      it "returns projects with clients_name matching search" do
        expect(subject).to match_array(result)
      end
    end

    context "when billable filter is applied" do
      before { params[:billable] = false }

      it "returns projects which are non billable" do
        expect(subject).to match_array(result)
      end
    end

    context "when team member filter is applied" do
      before { params[:user_id] = user_1.id }

      it "returns projects which have user_1 as it's team member" do
        expect(subject).to match_array(result)
      end
    end

    context "when client filter is applied" do
      before { params[:client_id] = [client_1.id] }

      let(:result) do
        [{
          clientName: client_1.name, id: project_1.id, isBillable: project_1.billable,
          minutesSpent: project_1.timesheet_entries.sum(:duration), name: project_1.name
        }]
      end

      it "returns projects which belongs to client_1" do
        expect(subject).to match_array(result)
      end
    end

    context "when all filters and search both are applied" do
      let(:params) do
        {
          client_id: [client_2.id],
          user_id: [user_1.id],
          billable: nil,
          serach: project_2.name
        }
      end
      let(:result) do
        [{
          clientName: client_2.name, id: project_2.id, isBillable: project_2.billable,
          minutesSpent: project_2.timesheet_entries.sum(:duration), name: project_2.name
        }]
      end

      it "returns projects as per filters and search" do
        expect(subject).to match_array(result)
      end
    end
  end

  describe "#project_list_query" do
    subject { company.project_list_query(params[:client_id], params[:user_id], params[:billable]) }

    let(:result) { [project_1, project_1, project_2, project_2] }

    context "when no arguments are passed" do
      it "returns list of all projects" do
        expect(subject).to match_array(result)
      end
    end

    context "when client_id argument is passed" do
      before { params[:client_id] = [client_1.id] }

      let(:result) { [project_1, project_1] }

      it "returns projects which belongs to client_1" do
        expect(subject).to match_array(result)
      end
    end

    context "when user_id argument is passed" do
      before { params[:user_id] = [user_1.id] }

      let(:result) { [project_1, project_2] }

      it "returns projects which have user_1 as team member" do
        expect(subject).to match_array(result)
      end
    end

    context "when billable argument is passed" do
      before { params[:billable] = [true] }

      it "returns projects which are billable" do
        expect(subject).to match_array([])
      end
    end

    context "when all argument are passed" do
      let(:params) do
        {
          client_id: [client_2.id],
          user_id: [user_1.id],
          billable: [false]
        }
      end

      it "returns projects as per db_query where condition" do
        expect(subject).to match_array([project_2])
      end
    end
  end
end
