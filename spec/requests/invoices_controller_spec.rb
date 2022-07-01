# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicesController, type: :request do
  let(:company) { create(:company) }
  let(:client) { create(:client, company:) }

  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }

  let(:invoice) { create(:invoice, client:) }

  before do
    create(:employment, company:, user: admin)
    create(:employment, company:, user: employee)
    create(:employment, company:, user: book_keeper)
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
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

    context "when user is a book_keeper" do
      before { sign_in book_keeper }

      it "redirects user to invoice page with status 200" do
        expect(subject).to eq 200
        expect(response.body).to include("Time tracking and invoicing")
      end
    end
  end
end
