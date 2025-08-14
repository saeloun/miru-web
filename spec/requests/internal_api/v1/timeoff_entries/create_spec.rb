# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::TimeoffEntry#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:leave) { create(:leave, company:) }
  let!(:leave_type) { create(
    :leave_type, name: "Annual", leave:, allocation_period: "months", allocation_frequency: "per_quarter",
    allocation_value: 1, carry_forward_days: 30,)
}

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "#create" do
      it "creates the timeoff entry successfully" do
        timeoff_entry = attributes_for(
          :timeoff_entry,
          user_id: user.id,
          leave_type_id: leave_type.id
        )

        send_request :post, internal_api_v1_timeoff_entries_path(timeoff_entry:), headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
      end

      it "throws unprocessable_content error if required attributes are missing" do
        invalid_timeoff_entry_attributes = attributes_for(
          :timeoff_entry,
          user_id: user.id,
          leave_type_id: leave_type.id
          ).except(:duration, :leave_date)

        send_request :post, internal_api_v1_timeoff_entries_path(timeoff_entry: invalid_timeoff_entry_attributes),
          headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it "throws 404 if required associations are missing" do
        invalid_timeoff_entry_attributes = attributes_for(:timeoff_entry)

        send_request :post, internal_api_v1_timeoff_entries_path(timeoff_entry: invalid_timeoff_entry_attributes),
          headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "#create" do
      it "creates the timeoff entry successfully" do
        timeoff_entry = attributes_for(
          :timeoff_entry,
          user_id: user.id,
          leave_type_id: leave_type.id
        )

        send_request :post, internal_api_v1_timeoff_entries_path(timeoff_entry:), headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
      end

      it "throws unprocessable_content error if required attributes are missing" do
        invalid_timeoff_entry_attributes = attributes_for(
          :timeoff_entry,
          user_id: user.id,
          leave_type_id: leave_type.id
          ).except(:duration, :leave_date)

        send_request :post, internal_api_v1_timeoff_entries_path(timeoff_entry: invalid_timeoff_entry_attributes),
          headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it "throws 404 if required associations are missing" do
        invalid_timeoff_entry_attributes = attributes_for(:timeoff_entry)

        send_request :post, internal_api_v1_timeoff_entries_path(timeoff_entry: invalid_timeoff_entry_attributes),
          headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to add timeoff entry" do
      send_request :post, internal_api_v1_timeoff_entries_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
