# frozen_string_literal: true

require "rails_helper"

RSpec.describe BulkPreviousEmploymentService do
  describe "#process" do
    let(:user) { create(:user) }
    let(:previous_employment) { create(:previous_employment, user:) }
    let(:added_employments) { [{ "company_name" => "ABC Company", "role" => "Software Engineer" }] }
    let(:updated_employments) {
  [{ "id" => previous_employment.id, "company_name" => "Updated Company", "role" => "Updated Role" }]
}
    let(:removed_employment_ids) { [2, 3] }
    let(:employments) do
      {
        user:,
        added_employments:,
        updated_employments:,
        removed_employment_ids:
      }
    end

    it "updates previous employments" do
      service = BulkPreviousEmploymentService.new(employments)

      expect {
        service.process
      }.to change { user.previous_employments.count }.by(1)
      updated_employment = user.previous_employments.find_by!(id: previous_employment.id)
      
      expect(updated_employment.company_name).to eq("Updated Company")
      expect(updated_employment.role).to eq("Updated Role")
      expect(user.previous_employments.pluck(:id)).not_to include(2, 3)
    end
  end
end
