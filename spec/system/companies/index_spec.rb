# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies index page", type: :system do
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

    it "returns the list of company's clients and company info" do
      with_forgery_protection do
        visit "/profile/edit"

        click_on(id: "company")

        click_on "ORG. SETTINGS"

        expect(page).to have_content(company.name)
        expect(page).to have_content(company.base_currency)
      end
    end
  end
end
