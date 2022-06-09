# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::User#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request(
        :post, user_invitation_path, params: {
          user: {
            first_name: "firstname",
            last_name: "lastname",
            email: "invited+111@example.com",
            roles: "employee"
          }
        })
    end

    it "creates new user with invitation token" do
      expect(response).to have_http_status(:ok)
      expect(User.count).to eq(2)
      expect(User.last.invitation_token).not_to be_nil
    end

    it "assigns company to new user" do
      expect(User.last.companies).to include(company)
    end

    it "assigns role to new user" do
      expect(User.last.has_role?(:employee, company)).to be_truthy
    end
  end

  # context "when the user is an employee" do
  #   before do
  #     create(:company_user, company:, user:)
  #     user.add_role :employee, company
  #     sign_in user
  #     send_request(
  #       :post, user_invitation_path, params: {
  #         user: {
  #           first_name: "first_name",
  #           last_name: "last_name",
  #           email: "invited@example.com",
  #           roles: "employee"
  #         }
  #       })
  #   end

  #   it "is not permitted to invite an user" do
  #     pp response
  #   end

  # end

  # context "when unauthenticated" do
  #   it "is not be permitted to generate a client" do
  #     send_request :post, internal_api_v1_clients_path
  #     expect(response).to have_http_status(:unauthorized)
  #     expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
  #   end
  # end
end
