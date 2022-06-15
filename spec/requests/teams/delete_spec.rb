# # frozen_string_literal: true

# require "rails_helper"

# RSpec.describe "Team#destroy", type: :request do
#   let(:company) { create(:company) }
#   let(:user) { create(:user, current_workspace_id: company.id) }

#   context "when user is an admin" do
#     before do
#       create(:company_user, company:, user:)
#       user.add_role :admin, company
#       sign_in user
#       send_request(:delete, team_path(user))
#     end

#     it "redirect to Team#index page" do
#       expect(response).to have_http_status(:redirect)
#       expect(response).to redirect_to(team_index_path)
#     end

#     # it "user can deleted" do
#       user.reload
#       expect(user.discarded_at).not_to be_nil
#     end
#   end

#   context "when user is an employee" do
#     before do
#       create(:company_user, company:, user:)
#       user.add_role :employee, company
#       sign_in user
#       send_request(:delete, team_path(user))
#     end

#     it "redirect to root_path" do
#       expect(response).to have_http_status(:redirect)
#       expect(response).to redirect_to(root_path)
#     end

#     it "user can't be deleted" do
#       expect(response).to have_http_status(:redirect)
#       expect(flash[:alert]).to eq("You are not authorized to destroy team.")
#     end
#   end

#   context "when user is a book keeper" do
#     before do
#       create(:company_user, company:, user:)
#       user.add_role :book_keeper, company
#       sign_in user
#       send_request(:delete, team_path(user))
#     end

#     it "redirect to root_path" do
#       expect(response).to have_http_status(:redirect)
#       expect(response).to redirect_to(root_path)
#     end

#     it "user can't be deleted" do
#       expect(response).to have_http_status(:redirect)
#       expect(flash[:alert]).to eq("You are not authorized to destroy team.")
#     end
#   end

#   context "when unauthenticated" do
#     it "user will be redirects to sign in path" do
#       send_request(:delete, team_path(user))
#       expect(response).to redirect_to(user_session_path)
#       expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
#     end
#   end
# end
