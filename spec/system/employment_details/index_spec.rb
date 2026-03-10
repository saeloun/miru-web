# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Employment index page", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
  end

  context "when user is an admin" do
    before do
      user.add_role :admin, company
      sign_in user
    end

    it "shows employment details screen" do
      with_forgery_protection do
        visit "/team/#{user.id}/employment"
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Current Employment", wait: 10)
      end
    end
  end
end
