# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::SessionsController#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "testing!") }

  context "when user is admin owner employee" do
    before do
      create(:company_user, company:, user:)
      send_request :post, user_session_path, params: { user: { email: user.email, password: user.password } }
    end

    it "then after_sign_in_path_for returns the time_tracking path" do
      expect(response).to redirect_to(time_tracking_index_path)
    end
  end

  # As per discussion we want to redirect all the users to time-tracking page as dashboard is blank.
  #
  # context "when user is not admin or owner" do
  #   before do
  #     create(:company_user, company:, user:)
  #     send_request :post, user_session_path, params: { user: { email: user.email, password: user.password } }
  #   end
  #
  #   it "then after_sign_in_path_for returns the time_tracking path" do
  #     expect(response).to redirect_to(time_tracking_index_path)
  #   end
  # end

  # context "when user is admin or owner of current company" do
  #   before do
  #     create(:company_user, company:, user:)
  #     user.add_role :admin, company
  #     send_request :post, user_session_path, params: { user: { email: user.email, password: user.password } }
  #   end
  #
  #   it "then after_sign_in_path_for returns the dashboard path" do
  #     expect(response).to redirect_to(dashboard_index_path)
  #   end
  # end

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
