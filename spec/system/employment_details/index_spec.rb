# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Employment index page", type: :system do
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

    it "returns the employment details" do
      with_forgery_protection do
        visit "/teams"

        find(".hoverIcon").hover.click
        click_on "EMPLOYEMENT DETAILS"

        expect(page).to have_content(user.employments.kept.first.employee_id)
        expect(page).to have_content(user.employments.kept.first.designation)
      end
    end
  end
end
