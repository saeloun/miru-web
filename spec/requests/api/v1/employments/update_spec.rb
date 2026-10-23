# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Employments#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:employment) { create(:employment, company_id: company.id, user_id: user.id) }

  it "returns a friendly duplicate error for a historical ID and accepts a valid retry" do
    user.add_role(:admin, company)
    sign_in user
    create(:employment, company:, employee_id: "reserved", discarded_at: Time.current)
    patch api_v1_employment_path(user), params: { employment: { employee_id: "reserved" } },
      headers: auth_headers(user)
    expect(response).to have_http_status(422)
    expect(json_response["errors"]).to eq("Employee ID has already been taken")
    patch api_v1_employment_path(user), params: { employment: { employee_id: "SI064" } },
      headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(employment.reload.employee_id).to eq("SI064")
    expect(company.reload.last_employee_number).to eq(64)
  end

  it "uses the same label for a named employee ID index conflict" do
    user.add_role(:admin, company)
    sign_in user
    create(:employment, company:, employee_id: "reserved")
    conflict = begin
      Employment.transaction(requires_new: true) { employment.update_columns(employee_id: "reserved") }
    rescue ActiveRecord::RecordNotUnique => exception
      exception
    end
    allow_any_instance_of(Employment).to receive(:update_profile!).and_raise(conflict)

    patch api_v1_employment_path(user), params: { employment: { employee_id: "reserved" } },
      headers: auth_headers(user)

    expect(response).to have_http_status(422)
    expect(json_response["errors"]).to eq("Employee ID has already been taken")
  end

  context "when user is an admin" do
    before do
      user.add_role :admin, company
      sign_in user
    end

    context "when employment is valid" do
      before do
        send_request(
          :patch, api_v1_employment_path(user), params: {
            employment: {
              designation: "Software Engineer",
              employment_type: "Consultant",
              employee_id: "SA123"
            }
          }, headers: auth_headers(user))
      end

      it "updates employment" do
        employment.reload
        expect(employment.designation).to eq("Software Engineer")
        expect(employment.employment_type).to eq("Consultant")
        expect(employment.employee_id).to eq("SA123")
      end

      it "returns success notice" do
        expect(json_response["notice"]).to match("Employment updated successfully")
      end
    end
  end

  context "when user is an employee" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request(
        :patch, api_v1_employment_path(user), params: {
          employment: {
            designation: "Software Engineer",
            employment_type: "Consultant",
            employee_id: "SA123"
          }
        }, headers: auth_headers(user))
    end

    it "updates employment" do
      employment.reload
      expect(employment.designation).to eq("Software Engineer")
      expect(employment.employment_type).to eq("Consultant")
      expect(employment.employee_id).to eq("SA123")
      expect(json_response["notice"]).to match("Employment updated successfully")
    end
  end

  context "when user is a book keeper" do
    before do
      user.add_role :book_keeper, company
      sign_in user
      send_request(
        :patch, api_v1_employment_path(user), params: {
          employment: {
            designation: "Software Engineer",
            employment_type: "Consultant",
            employee_id: "SA123"
          }
        }, headers: auth_headers(user))
    end

    it "updates employment" do
      employment.reload
      expect(response).to have_http_status(:ok)
      expect(employment.designation).to eq("Software Engineer")
      expect(employment.employment_type).to eq("Consultant")
      expect(employment.employee_id).to eq("SA123")
      expect(json_response["notice"]).to match("Employment updated successfully")
    end
  end

  context "when the user has a discarded employment" do
    let!(:employment) do
      discarded_employment
      create(:employment, company:, user:, joined_at: nil, resigned_at: nil)
    end
    let(:discarded_employment) do
      create(:employment, company:, user:, joined_at: Date.new(2019, 1, 1), resigned_at: nil, discarded_at: Time.current)
    end

    before do
      user.add_role :admin, company
      sign_in user
      send_request(
        :patch, api_v1_employment_path(user), params: {
          employment: {
            designation: "Current designation", employment_type: "Consultant", employee_id: "SA123",
            joined_at: Date.current
          }
        }, headers: auth_headers(user))
    end

    it "updates only the current employment" do
      expect(response).to have_http_status(:ok)
      expect(employment.reload.designation).to eq("Current designation")
      expect(discarded_employment.reload.designation).to eq("SDE")
    end
  end

  context "when a self-service user updates another user's employment" do
    let(:book_keeper) { create(:user, current_workspace_id: company.id) }

    before do
      book_keeper.add_role :book_keeper, company
      sign_in book_keeper
      send_request(
        :patch, api_v1_employment_path(user), params: {
          employment: {
            designation: "Software Engineer",
            employment_type: "Consultant",
            employee_id: "SA123"
          }
        }, headers: auth_headers(book_keeper))
    end

    it "forbids the update" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
