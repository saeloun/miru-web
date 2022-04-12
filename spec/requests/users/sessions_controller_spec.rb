# frozen_string_literal: true

require "rails_helper"

RSpec.describe Users::SessionsController, type: :controller do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is not admin or owner" do
    it "then after_sign_in_path_for returns the time_tracking path" do
      expect(subject.after_sign_in_path_for(user)).to eq(time_tracking_index_path)
    end
  end

  context "when user is admin or owner of current company" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "then after_sign_in_path_for returns the dashboard path" do
      expect(subject.after_sign_in_path_for(user)).to eq(dashboard_index_path)
    end
  end

  context "when user has owner role but not associated with any company" do
    before do
      user.add_role :owner
      sign_in user
    end

    it "then after_sign_in_path_for returns the new company path" do
      expect(subject.after_sign_in_path_for(user)).to eq(new_company_path)
    end
  end
end
