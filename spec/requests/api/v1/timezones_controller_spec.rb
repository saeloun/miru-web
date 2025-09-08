# frozen_string_literal: true

require "rails_helper"

shared_examples_for "Api::V1::TimezonesController index" do
  it "returns timezones in response" do
    subject
    expect(json_response.class).to be Hash
    expect(json_response["timezones"].keys).to include("IN")
    expect(json_response["timezones"]["US"]).to include("(GMT-05:00) Eastern Time (US & Canada)")
  end
end

RSpec.describe Api::V1::TimezonesController, type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: admin)
    create(:employment, company:, user: employee)
    create(:employment, company:, user: book_keeper)
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  describe "GET index" do
    context "when user is an admin" do
      before { sign_in admin }

      subject { send_request :get, api_v1_timezones_path, headers: auth_headers(admin) }

      it_behaves_like "Api::V1::TimezonesController index"
    end

    context "when user is an employee" do
      before { sign_in employee }

      subject { send_request :get, api_v1_timezones_path, headers: auth_headers(employee) }

      it_behaves_like "Api::V1::TimezonesController index"
    end

    context "when user is a book_keeper" do
      before { sign_in book_keeper }

      subject { send_request :get, api_v1_timezones_path, headers: auth_headers(book_keeper) }

      it_behaves_like "Api::V1::TimezonesController index"
    end
  end
end
