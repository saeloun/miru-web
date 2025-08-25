# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimeoffEntries#destroy", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:leave) { create(:leave, company:) }
  let!(:leave_type) { create(
    :leave_type, leave:, allocation_period: "months", allocation_frequency: "per_quarter",
    allocation_value: 1, carry_forward_days: 30,)
}
  let!(:timeoff_entry) { create(:timeoff_entry, user:, leave_type:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "#destroy" do
      it "deletes timeoff entry successfully" do
        send_request :delete, api_v1_timeoff_entry_path(id: timeoff_entry.id), headers: auth_headers(user)
        expect(response).to be_successful
        expect(company.timeoff_entries.discarded.pluck(:id).include?(timeoff_entry.id)).to eq(true)
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "#destroy" do
      it "deletes timeoff entry successfully" do
        send_request :delete, api_v1_timeoff_entry_path(id: timeoff_entry.id), headers: auth_headers(user)
        expect(response).to be_successful
        expect(company.timeoff_entries.discarded.pluck(:id).include?(timeoff_entry.id)).to eq(true)
      end
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to delete timeoff entry" do
      send_request :delete, api_v1_timeoff_entry_path(id: timeoff_entry.id)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
