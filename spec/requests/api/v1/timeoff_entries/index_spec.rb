# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimeoffEntries#index", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company

    create(:employment, company:, user: book_keeper)
    book_keeper.add_role :book_keeper, company
  end

  context "when user is an admin" do
    before do
      sign_in admin
    end

    it "returns timeoff index response" do
      send_request :get,
        api_v1_timeoff_entries_path,
        params: { user_id: admin.id, year: Date.current.year },
        headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(json_response).to have_key("timeoffEntries")
      expect(json_response).to have_key("employees")
    end
  end

  context "when user is an employee" do
    before do
      sign_in employee
    end

    it "returns timeoff index response" do
      send_request :get,
        api_v1_timeoff_entries_path,
        params: { user_id: employee.id, year: Date.current.year },
        headers: auth_headers(employee)

      expect(response).to have_http_status(:ok)
      expect(json_response).to have_key("timeoffEntries")
    end
  end

  context "when user is a book keeper" do
    before do
      sign_in book_keeper
      send_request :get,
        api_v1_timeoff_entries_path,
        params: { user_id: book_keeper.id, year: Date.current.year },
        headers: auth_headers(book_keeper)
    end

    it "is not permitted" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      send_request :get, api_v1_timeoff_entries_path, params: { year: Date.current.year }

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
