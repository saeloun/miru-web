# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Edit employment details", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }


  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  context "when editing employment details" do
    it "shows editable employment details for current employment" do
      with_forgery_protection do
        visit "/team/#{user.id}/employment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Employment Details", wait: 10)
        expect(page).to have_button("Edit", wait: 10)
      end
    end

    it "shows previous employment section" do
      with_forgery_protection do
        visit "/team/#{user.id}/employment"
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Previous Employment", wait: 10)
      end
    end
  end
end
