# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::Invitations#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when new user is invited" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request(
        :post, user_invitation_path, params: {
          user: {
            first_name: user.first_name,
            last_name: user.last_name,
            email: "invited@example.com",
            roles: "employee"
          }
        })
      @user = User.find_by(email: "invited@example.com")
    end

    it "creates new user with invitation token" do
      expect(User.count).to eq(2)
      expect(@user.invitation_token).not_to be_nil
    end

    it "assigns company to new user" do
      expect(@user.companies).to include(company)
    end

    it "assigns role to new user" do
      expect(@user.has_role?(:employee, company)).to be_truthy
    end

    it "successfully redirects to team_index_path" do
      expect(response).to redirect_to(team_index_path)
    end
  end

  context "when existing user is invited" do
    before do
      ActionMailer::Base.deliveries.clear
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      @user2 = create(:user, current_workspace_id: company.id)
      send_request(
        :post, user_invitation_path, params: {
          user: {
            first_name: @user2.first_name,
            last_name: @user2.last_name,
            email: @user2.email,
            roles: "employee"
          }
        })
      @user2.reload
    end

    it "existing user won't have invitation token" do
      expect(@user2.invitation_token).to be_nil
    end

    it "assigns company to existing user" do
      expect(@user2.companies).to include(company)
    end

    it "assigns role to existing user" do
      expect(@user2.has_role?(:employee, company)).to be_truthy
    end

    it "sents mail to invited users" do
      expect(ActionMailer::Base.deliveries.count).to eq(1)
      expect(ActionMailer::Base.deliveries.last.to).to include(@user2.email)
    end

    it "successfully redirects to team_index_path" do
      expect(response).to redirect_to(team_index_path)
    end
  end
end
