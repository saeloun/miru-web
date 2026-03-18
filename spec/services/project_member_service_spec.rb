# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectMemberService do
  describe "#process" do
    let(:company) { create(:company) }
    let(:project) { create(:project, client: create(:client, company:)) }
    let(:added_user) { create(:user) }
    let(:updated_user) { create(:user) }
    let(:removed_user) { create(:user) }
    let!(:existing_member) { create(:project_member, project:, user: updated_user, hourly_rate: 50) }
    let!(:removed_member) { create(:project_member, project:, user: removed_user, hourly_rate: 60) }

    it "adds, updates, and discards members in one transaction" do
      described_class.new(
        project:,
        added_members: [{ "id" => added_user.id, "hourly_rate" => 75 }],
        updated_members: [{ "id" => updated_user.id, "hourly_rate" => 95 }],
        removed_member_ids: [removed_user.id]
      ).process

      added_member = ProjectMember.find_by!(project:, user: added_user)

      expect(added_member.hourly_rate).to eq(75)
      expect(existing_member.reload.hourly_rate).to eq(95)
      expect(removed_member.reload).to be_discarded
    end

    it "ignores added members without an hourly rate" do
      expect {
        described_class.new(
          project:,
          added_members: [{ "id" => added_user.id }],
          updated_members: [],
          removed_member_ids: []
        ).process
      }.not_to change(ProjectMember, :count)
    end
  end
end
