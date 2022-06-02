# frozen_string_literal: true

require "rails_helper"

RSpec.describe SubscriptionsController, type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    create(:company_user, company:, user: admin)
    create(:company_user, company:, user: employee)
    employee.add_role :employee, company
  end

  describe "GET index" do
    subject { send_request :get, subscriptions_path }

    context "when user is not signed in" do
      it "redirects user to sign in page with 302 status" do
        subject

        expect(response.status).to eq 302
        expect(response).to redirect_to(new_user_session_path)
      end
    end

    context "when user does not have any role" do
      before { sign_in admin }

      it "returns 302 response code and redirects user to root path" do
        subject

        expect(response.status).to eq 302
        expect(response).to redirect_to(root_path)
      end
    end

    context "when user is an admin or owner" do
      before do
        admin.add_role :admin, company
        sign_in admin
      end

      it "returns 200 status and renders timesheet page" do
        subject

        expect(response.status).to eq 200
        expect(response.body).to include("Time tracking and invoicing")
      end
    end

    context "when user is an employee" do
      before do
        employee.add_role :employee, company
        sign_in employee
      end

      it "fails" do
        subject

        expect(response.status).to eq 302
        expect(response).to redirect_to(root_path)
      end
    end
  end
end
