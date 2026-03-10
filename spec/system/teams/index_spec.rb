# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Team Member", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee_user) { create(:user, current_workspace_id: company.id) }

  context "when user as an admin" do
    context "with less than ten team members" do
      before do
        create(:employment, company:, user:)
        create(:employment, company:, user: employee_user)
        user.add_role :admin, company
        employee_user.add_role :employee, company
        sign_in(user)
      end

      it "cannot see the pagination" do
        with_forgery_protection do
          visit "/team"

          expect(page).not_to have_css(
            "button.m-1.mx-4.p-1.text-base.font-bold.text-muted-foreground.text-primary", text: "1"
          )
        end
      end
    end

    context "with more than ten members" do
      before do
        create(:employment, company:, user:)
        create(:employment, company:, user: employee_user)
        build_list(:employment, 20, company:) do |item|
          item.user = create(:user, current_workspace_id: company.id)
          item.save!
        end
        user.add_role :admin, company
        employee_user.add_role :employee, company
        sign_in(user)
      end

      it "shows pagination controls" do
        with_forgery_protection do
          visit "/team"
          expect(page).to have_content("Page 1 of", wait: 10)
        end
      end

      it "shows team table with members" do
        with_forgery_protection do
          visit "/team"
          expect(page).to have_content("Team Member", wait: 10)
          expect(page).to have_content("Role", wait: 10)
        end
      end
    end
  end
end
