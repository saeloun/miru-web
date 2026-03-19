# frozen_string_literal: true

require "rails_helper"

RSpec.describe CustomLeavesService do
  describe "#process" do
    let(:leave) { create(:leave) }
    let!(:existing_custom_leave) { create(:custom_leave, leave:, name: "Optional Leave") }

    it "adds, updates, and removes custom leaves in one transaction" do
      described_class.new(leave, {
        add_custom_leaves: [{ name: "Festival Leave", allocation_value: 4, allocation_period: "days" }],
        update_custom_leaves: [{ id: existing_custom_leave.id, name: "Updated Leave", allocation_value: 8, allocation_period: "days" }],
        remove_custom_leaves: [existing_custom_leave.id]
      }).process

      expect(leave.custom_leaves.find_by(name: "Festival Leave")).to be_present
      expect(leave.custom_leaves.find_by(id: existing_custom_leave.id)).to be_nil
    end
  end
end
