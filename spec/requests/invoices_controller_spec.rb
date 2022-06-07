# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicesController, type: :request do
  let(:company) { create(:company) }
  let(:client) { create(:client, company:) }

  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  let(:invoice) { create(:invoice, client:) }

  before do
    create(:company_user, company:, user: admin)
    create(:company_user, company:, user: employee)
    admin.add_role :admin, company
    employee.add_role :employee, company
  end

  describe "GET index" do
    subject { send_request :get, invoices_path }

    context "when user is an admin" do
      before { sign_in admin }

      it "redirects user to invoice page with status 200" do
        expect(subject).to eq 200
        expect(response.body).to include("Time tracking and invoicing")
      end
    end

    context "when user is an employee" do
      before { sign_in employee }

      it "redirects user to root with status 302" do
        expect(subject).to eq 302
        expect(response).to redirect_to(root_path)
      end
    end
  end
end
