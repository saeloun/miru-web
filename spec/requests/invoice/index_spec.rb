# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice#index", type: :request do
  let(:company) do
    create(:company, clients: create_list(:client_with_invoices, 5))
  end

  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :get, invoices_path
    end

    it "they should be able to visit index page successfully" do
      expect(response).to be_successful
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, invoices_path
    end

    it "they should not be permitted to visit index page" do
      expect(response).to have_http_status(:redirect)
      expect(flash["alert"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to view invoices" do
      send_request :get, invoices_path
      expect(response).to have_http_status(:redirect)
      expect(flash["alert"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
