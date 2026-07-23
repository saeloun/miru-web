# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimeoffEntries#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:leave) { create(:leave, company:) }
  let!(:leave_type) { create(
    :leave_type, name: "Annaul", leave:, allocation_period: "months", allocation_frequency: "per_quarter",
    allocation_value: 1, carry_forward_days: 30,)
}
  let!(:timeoff_entry) { create(:timeoff_entry, user:, leave_type:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "timeoff entry updation" do
      it "updates timeoff entry successfully" do
        send_request :patch, api_v1_timeoff_entry_path(timeoff_entry.id), params: {
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
        send_request :patch, api_v1_timeoff_entry_path(timeoff_entry.id), params: {
          timeoff_entry: {
            user_id: user.id,
            leave_type_id: leave_type.id,
            duration: "",
            leave_date: Time.now,
            note: "Updated Note"
          }
        }, headers: auth_headers(user)

        puts json_response["errors"]

        expect(response).to have_http_status(:unprocessable_content)
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
        send_request :patch, api_v1_timeoff_entry_path(timeoff_entry.id), params: {
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
        send_request :patch, api_v1_timeoff_entry_path(timeoff_entry.id), params: {
          timeoff_entry: {
            user_id: user.id,
            leave_type_id: leave_type.id,
            duration: "",
            leave_date: Time.now,
            note: "Updated Note"
          }
        }, headers: auth_headers(user)

        puts json_response["errors"]

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to match("Duration can't be blank")
      end

      it "cannot hijack another employee's timeoff entry by reassigning it to themselves" do
        victim = create(:user, current_workspace_id: company.id)
        create(:employment, company:, user: victim)
        victim.add_role :employee, company
        victim_entry = create(:timeoff_entry, user: victim, leave_type:, duration: 60)

        send_request :patch, api_v1_timeoff_entry_path(victim_entry.id), params: {
          timeoff_entry: {
            user_id: user.id,
            leave_type_id: leave_type.id,
            duration: 999,
            leave_date: Time.now,
            note: "Hijacked"
          }
        }, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
        expect(victim_entry.reload.user_id).to eq(victim.id)
        expect(victim_entry.duration).to eq(60)
      end

      it "cannot reassign their own entry to another employee" do
        other = create(:user, current_workspace_id: company.id)
        create(:employment, company:, user: other)
        other.add_role :employee, company

        send_request :patch, api_v1_timeoff_entry_path(timeoff_entry.id), params: {
          timeoff_entry: {
            user_id: other.id,
            leave_type_id: leave_type.id,
            duration: 120,
            leave_date: Time.now,
            note: "Transfer attempt"
          }
        }, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
        expect(timeoff_entry.reload.user_id).to eq(user.id)
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
