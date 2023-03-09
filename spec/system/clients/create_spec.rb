# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Create client", type: :system do
  let(:company) { create(:company_with_address) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "creates the client successfully" do
      with_forgery_protection do
        visit "time-tracking"
        expect(page).to have_content "MONTH"
      end
    end
  end
end
