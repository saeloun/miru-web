# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::TimeEntries::PageService do
  let(:company) { create(:company) }

  describe "pagination for team members" do
    before do
      create_list(:user, 5)
      User.all.each do | user |
        create(:employment, company:, user:)
      end
    end

    context "when no team members filter is provided" do
      context "when no page is specified" do
        before do
          @page_service = described_class.new({ group_by: "team_member" }, company)
          @page_service.process
          @expected_user_ids = User.all.order(:first_name).pluck(:id)
        end

        it "Fetches first users to page with limit of 5" do
          expect(@page_service.es_filter).to eq({ user_id: @expected_user_ids })
        end
      end

      context "when next page is specified" do
        before do
          @page_service = described_class.new({ group_by: "team_member", page: 2 }, company)
          @page_service.process
          @expected_user_ids = User.all.order(:first_name).pluck(:id)
        end

        it "Fetches users" do
          expect(@page_service.es_filter).to eq({ user_id: @expected_user_ids })
        end
      end
    end

    context "when team members filter is provided" do
      context "when no page is specified" do
        before do
          @filter_user_ids = User.all.order(:first_name).pluck(:id)
          @page_service = described_class.new({ group_by: "team_member", team_member: @filter_user_ids }, company)
          @page_service.process
        end

        it "Fetches users of given page with matching filter" do
          expect(@page_service.es_filter).to eq({ user_id: @filter_user_ids })
        end
      end

      context "when next page is specified" do
        before do
          @filter_user_ids = User.all.order(:first_name).pluck(:id)
          @page_service = described_class.new(
            { group_by: "team_member", team_member: @filter_user_ids, page: 2 },
            company)
          @page_service.process
        end

        it "Fetches users of next page with matching filter" do
          expect(@page_service.es_filter).to eq({ user_id: @filter_user_ids })
        end
      end
    end
  end

  describe "pagination for clients" do
    before do
      create_list(:client, 5, company:)
    end

    context "when no client filter is provided" do
      context "when no page is specified" do
        before do
          @page_service = described_class.new({ group_by: "client" }, company)
          @page_service.process
          @expected_client_ids = Client.all.order(:name).pluck(:id)
        end

        it "Fetches clients" do
          expect(@page_service.es_filter).to eq({ client_id: @expected_client_ids })
        end
      end

      context "when next page is specified" do
        before do
          @page_service = described_class.new({ group_by: "client", page: 2 }, company)
          @page_service.process
          @expected_client_ids = Client.all.order(:name).pluck(:id)
        end

        it "Fetches clients" do
          expect(@page_service.es_filter).to eq({ client_id: @expected_client_ids })
        end
      end
    end

    context "when clients filter is provided" do
      context "when no page is specified" do
        before do
          @filter_client_ids = Client.all.order(:name).pluck(:id)
          @page_service = described_class.new({ group_by: "client", client: @filter_client_ids }, company)
          @page_service.process
        end

        it "Fetches clients of given page with matching filter" do
          expect(@page_service.es_filter).to eq({ client_id: @filter_client_ids })
        end
      end

      context "when next page is specified" do
        before do
          @filter_client_ids = Client.all.order(:name).pluck(:id)
          @page_service = described_class.new(
            { group_by: "client", client: @filter_client_ids, page: 2 },
            company)
          @page_service.process
          @expected_pagination_details = {
            page: 2, pages: 2, first: false, prev: 1, next: nil, last: 2
          }
        end

        it "Fetches clients of next page with matching filter" do
          expect(@page_service.es_filter).to eq({ client_id: @filter_client_ids })
        end
      end
    end
  end

  describe "pagination for projects" do
    before do
      client = create(:client, company:)
      create_list(:project, 5, client:)
    end

    context "when no project filter is provided" do
      context "when no page is specified" do
        before do
          @page_service = described_class.new({ group_by: "project" }, company)
          @page_service.process
          @expected_project_ids = company.projects.all.order(:name).pluck(:id)
        end

        it "Fetches projects" do
          expect(@page_service.es_filter).to eq({ project_id: @expected_project_ids })
        end
      end

      context "when next page is specified" do
        before do
          @page_service = described_class.new({ group_by: "project", page: 2 }, company)
          @page_service.process
          @expected_project_ids = Project.all.order(:name).pluck(:id)
        end

        it "Fetches projects" do
          expect(@page_service.es_filter).to eq({ project_id: @expected_project_ids })
        end
      end
    end

    context "when projects filter is provided" do
      context "when no page is specified" do
        before do
          @filter_project_ids = Project.all.order(:name).pluck(:id)
          @page_service = described_class.new({ group_by: "project", project: @filter_project_ids }, company)
          @page_service.process
        end

        it "Fetches projects of given page with matching filter" do
          expect(@page_service.es_filter).to eq({ project_id: @filter_project_ids })
        end
      end

      context "when next page is specified" do
        before do
          @filter_project_ids = Project.all.order(:name).pluck(:id)
          @page_service = described_class.new(
            { group_by: "project", project: @filter_project_ids, page: 2 },
            company)
          @page_service.process
        end

        it "Fetches projects of next page with matching filter" do
          expect(@page_service.es_filter).to eq({ project_id: @filter_project_ids })
        end
      end
    end
  end
end
