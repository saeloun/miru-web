# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Projects#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
    end

    context "when project is valid" do
      before do
        send_request(
          :post, projects_path, params: {
            project: {
              client_id: client.id,
              name: "Test project",
              billable: true
            }
          })
      end

      it "creates a new project" do
        expect(Project.count).to eq(1)
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
      end
    end

    context "when company is invalid" do
      before do
        send_request(
          :post, projects_path, params: {
            project: {
              client_id: client.id,
              name: "",
              billable: true
            }
          })
      end

      it "will not be created" do
        expect(Project.count).to eq(0)
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :employee, company
      sign_in user
    end

    context "when project is valid" do
      before do
        send_request(
          :post, projects_path, params: {
            project: {
              client_id: client.id,
              name: "Test project",
              billable: true
            }
          })
      end

      it "will be created" do
        expect(Company.count).to eq(1)
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
      end
    end

    context "when project is invalid" do
      before do
        send_request(
          :post, projects_path, params: {
            project: {
              client_id: client.id,
              name: "",
              billable: true
            }
          })
      end

      it "will not be created" do
        expect(Project.count).to eq(0)
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
      end
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request(
        :post, projects_path, params: {
          project: {
            client_id: client.id,
            name: "Test project",
            billable: true
          }
        })
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
