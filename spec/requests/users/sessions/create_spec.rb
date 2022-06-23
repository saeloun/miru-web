# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::SessionsController#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "testing!") }

  context "when user is an admin, owner, employee" do
    before do
      create(:company_user, company:, user:)
      send_request :post, user_session_path, params: { user: { email: user.email, password: user.password } }
    end

    it "then after_sign_in_path_for returns the time_tracking path" do
      expect(response).to redirect_to(time_tracking_index_path)
    end
  end

  context "when user has owner role but not associated with any company" do
    before do
      user.add_role :owner
      send_request :post, user_session_path, params: { user: { email: user.email, password: user.password } }
    end

    it "then after_sign_in_path_for returns the new company path" do
      expect(response).to redirect_to(new_company_path)
    end
  end
end
