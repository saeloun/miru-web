# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::TimeoffEntries#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:leave) { create(:leave, company:) }
  let!(:leave_type) { create(:leave_type, name: "Annaul", leave:) }
  let!(:timeoff_entry) { create(:timeoff_entry, user:, leave_type:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "timeoff entry updation" do
      it "updates timeoff entry successfully" do
        send_request :patch, internal_api_v1_timeoff_entry_path(timeoff_entry.id), params: {
          timeoff_entry: {
            user_id: user.id,
            leave_type_id: leave_type.id,
            duration: 400,
            leave_date: Time.now,
            note: "Updated Note"
          }
        }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["timeoff_entry"]["duration"]).to eq(400)
      end

      it "throws 422 when duration is blank" do
        send_request :patch, internal_api_v1_timeoff_entry_path(timeoff_entry.id), params: {
          timeoff_entry: {
            user_id: user.id,
            leave_type_id: leave_type.id,
            duration: "",
            leave_date: Time.now,
            note: "Updated Note"
          }
        }, headers: auth_headers(user)

        puts json_response["errors"]

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["errors"]).to match("Duration can't be blank")
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "timeoff entry updation" do
      it "updates timeoff entry successfully" do
        send_request :patch, internal_api_v1_timeoff_entry_path(timeoff_entry.id), params: {
          timeoff_entry: {
            user_id: user.id,
            leave_type_id: leave_type.id,
            duration: 400,
            leave_date: Time.now,
            note: "Updated Note"
          }
        }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["timeoff_entry"]["duration"]).to eq(400)
      end

      it "throws 422 when duration is blank" do
        send_request :patch, internal_api_v1_timeoff_entry_path(timeoff_entry.id), params: {
          timeoff_entry: {
            user_id: user.id,
            leave_type_id: leave_type.id,
            duration: "",
            leave_date: Time.now,
            note: "Updated Note"
          }
        }, headers: auth_headers(user)

        puts json_response["errors"]

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["errors"]).to match("Duration can't be blank")
      end
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to delete timeoff entry" do
      send_request :delete, internal_api_v1_timeoff_entry_path(id: timeoff_entry.id)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
