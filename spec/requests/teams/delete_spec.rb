# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Team#destroy", type: :request do
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
        send_request(:delete, team_path(user))
      end

      it "user can deleted" do
        user.reload
        expect(user.discarded_at).not_to be_nil
      end
    end

    context "when user is employee", user_employee: true do
      before do
        send_request(:delete, team_path(user))
      end

      it "user can't be deleted" do
        expect(response).to have_http_status(:redirect)
        expect(flash[:alert]).to eq("You are not authorized to destroy team.")
      end
    end
  end
end
