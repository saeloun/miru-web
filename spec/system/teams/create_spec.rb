# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Inviting team member", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    context "when inviting team member" do
      it "can open team page" do
        with_forgery_protection do
          visit "/team"
          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("Team", wait: 10)
        end
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in(user)
    end

    it "can open teams page" do
      with_forgery_protection do
        visit "/team"
        expect(page).to have_css("#react-root", wait: 10)
      end
    end
  end
end
