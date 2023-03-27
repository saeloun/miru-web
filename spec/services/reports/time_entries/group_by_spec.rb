# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GroupBy", type: :service do
  describe "#is_valid_group_by" do
    context "when group_by_field is not present" do
      it "returns false" do
        expect(Reports::TimeEntries::GroupBy.new(nil).valid_group_by?).to eq(false)
      end
    end

    context "when invalid group_by_field is passed" do
      it "returns false" do
        expect(Reports::TimeEntries::GroupBy.new("invalid_option").valid_group_by?).to eq(false)
      end
    end

    context "when group_by_field is `team_member`" do
      group_by = "team_member"
      it "returns false" do
        expect(Reports::TimeEntries::GroupBy.new(group_by).valid_group_by?).to eq(true)
      end
    end

    context "when group_by_field is `client`" do
      group_by = "client"
      it "returns false" do
        expect(Reports::TimeEntries::GroupBy.new(group_by).valid_group_by?).to eq(true)
      end
    end

    context "when group_by_field is `project`" do
      group_by = "project"
      it "returns false" do
        expect(Reports::TimeEntries::GroupBy.new(group_by).valid_group_by?).to eq(true)
      end
    end
  end
end
