# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::TimeEntries::Result do
  let(:company) { create(:company) }
  let(:client) { create(:client, :with_logo, company:) }
  let(:project) { create(:project, client:) }

  before do
    create_list(:user, 12)
    User.all.each do | user |
      create(:employment, company:, user:)
      create(:timesheet_entry, project:, user:)
    end
  end

  describe "#process" do
    context "when group_by field is not specified" do
      es_response = [{ a: 1 }, { b: 2 }]
      service_response = described_class.new(es_response, nil).process

      it "returns data with blank label" do
        expect(service_response).to eq([{ label: "", entries: es_response }])
      end
    end

    context "when invalid group_by field is specified" do
        es_response = [{ a: 1 }, { b: 2 }]
        service_response = described_class.new(es_response, "abc").process

        it "returns data with blank label" do
          expect(service_response).to eq([{ label: "", entries: es_response }])
        end
      end

    context "when group_by team_member is specified" do
      es_response = [{ user_name: "B", id: 1 }.to_dot,
                     { user_name: "B", id: 2 }.to_dot,
                     { user_name: "A", id: 3 }.to_dot]
      service_response = described_class.new(es_response, "team_member").process

      it "returns data with goupes labelled by user names" do
        expect(service_response).to eq(
          [
                    { label: "A", entries: [{ user_name: "A", id: 3 }] },
                    { label: "B", entries: [{ user_name: "B", id: 1 }, { user_name: "B", id: 2 }] }
                    ])
      end
    end

    context "when group_by client is specified" do
      es_response = [{ client_name: "B", id: 1 }.to_dot,
                     { client_name: "B", id: 2 }.to_dot,
                     { client_name: "A", id: 3 }.to_dot]
      service_response = described_class.new(es_response, "client").process

      it "returns data with goupes labelled by user names" do
        expect(service_response).to eq(
          [
                    { label: "A", entries: [{ client_name: "A", id: 3 }] },
                    { label: "B", entries: [{ client_name: "B", id: 1 }, { client_name: "B", id: 2 }] }
                    ])
      end
    end

    context "when group_by project is specified" do
      es_response = [{ project_name: "B", id: 1 }.to_dot,
                     { project_name: "B", id: 2 }.to_dot,
                     { project_name: "A", id: 3 }.to_dot]
      service_response = described_class.new(es_response, "project").process

      it "returns data with goupes labelled by user names" do
        expect(service_response).to eq(
          [
                    { label: "A", entries: [{ project_name: "A", id: 3 }] },
                    { label: "B", entries: [{ project_name: "B", id: 1 }, { project_name: "B", id: 2 }] }
                    ])
      end
    end
  end
end
