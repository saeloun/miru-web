# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GroupBy", type: :service do
  def group_by_field_to_term_field(field)
    case field
    when "team_member"
      "user_id"
    when "client"
      "client_id"
    when "project"
      "project_id"
    end
  end

  def group_by_query(field)
    {
      aggs:
            {
              grouped_reports:
                      {
                        terms: { field: group_by_field_to_term_field(field) },
                        aggs:
                        {
                          top_report_hits:
                                        {
                                          top_hits:
                                                          {
                                                            _source: ["id"],
                                                            size: 100,
                                                            sort: [{ work_date: { order: "desc" } }]
                                                          }
                                        }
                        }
                      }
            }
    }
  end

  context "when group_by_field is not present" do
    res = Report::GroupBy.process(nil)
    it "returns the empty group_by query" do
      expect(res).to eq({})
    end
  end

  context "when invalid group_by_field is passed" do
    res = Report::GroupBy.process("day")
    it "returns the empty group_by query" do
      expect(res).to eq({})
    end
  end

  context "when group_by_field is `team_member`" do
    group_by = "team_member"
    res = Report::GroupBy.process(group_by)
    it "returns the expected group_by query" do
      expect(res).to eq(group_by_query(group_by))
    end
  end

  context "when group_by_field is `client`" do
    group_by = "client"
    res = Report::GroupBy.process(group_by)
    it "returns the expected group_by query" do
      expect(res).to eq(group_by_query(group_by))
    end
  end

  context "when group_by_field is `project`" do
    group_by = "project"
    res = Report::GroupBy.process(group_by)
    it "returns the expected group_by query" do
      expect(res).to eq(group_by_query(group_by))
    end
  end

  context "when group_by_field is `week`" do
    group_by = "week"
    res = Report::GroupBy.process(group_by)
    expected_query =
      {
        aggs:
               {
                 grouped_reports:
                           {
                             date_histogram:
                                          {
                                            field: "work_date",
                                            calendar_interval: "week"
                                          },
                             aggs:
                              {
                                top_report_hits:
                                                 {
                                                   top_hits:
                                                                      {
                                                                        _source: ["id"],
                                                                        size: 100,
                                                                        sort: [{ work_date: { order: "desc" } }]
                                                                      }
                                                 }
                              }
                           }
               }
      }
    it "returns the expected group_by query" do
      expect(res).to eq(expected_query)
    end
  end
end
