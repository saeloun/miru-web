# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Team#update", type: :request do
  let (:company) { create(:company) }
  let(:user) { create(:user, company_id: company.id) }

  context "when authenticated" do
    before do
      user.add_role :admin
      sign_in user
    end

    before(:each, :user_employee) do
      user.remove_role :admin
      user.add_role :employee
    end

    context "when user is admin" do
      before do
        send_request(:put, team_path(user), params: {
          user: {
            first_name: "test",
            last_name: "example",
            email: "test@example.com",
            roles: "admin"
          }
        })
      end

      it "user can be updated" do
        user.reload
        expect(user.first_name).to eq("test")
        expect(user.last_name).to eq("example")
        expect(user.email).to eq("test@example.com")
      end

      it "redirects to root_path " do
        expect(response).to have_http_status(:redirect)
      end
    end

    context "when user is employee", user_employee: true do
      before do
        send_request(:put, team_path(user), params: {
          user: {
            first_name: "test",
            last_name: "example",
            email: "test@example.com",
            roles: "admin"
          }
        })
      end

      it "user can't be updated", test_employee: true do
        expect(response).to have_http_status(:redirect)
        expect(flash[:alert]).to eq("You are not authorized to update team.")
      end
    end
  end
end
