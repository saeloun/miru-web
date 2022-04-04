# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::Invitations#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:company_user, company:, user_id: user.id)
    user.add_role :admin, company
    sign_in user
    send_request :post, user_invitation_path, params: { user: { email: "invited@example.com", roles: "employee" } }
  end

  it "creates new user with invitation token" do
    expect(User.count).to eq(2)
    expect(User.last.invitation_token).not_to be_nil
  end

  it "assigns company to new user" do
    expect(User.last.companies).to include(company)
  end

  it "assigns role to new user" do
    expect(User.last.has_role?(:employee, company)).to be_truthy
  end

  it "successfully redirects to team_index_path" do
    expect(response).to redirect_to(team_index_path)
  end
end
