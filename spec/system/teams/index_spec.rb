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
          visit "/teams"

          expect(page).not_to have_css(
            "button.m-1.mx-4.p-1.text-base.font-bold.text-miru-dark-purple-400.text-miru-han-purple-1000", text: "1"
          )
        end
      end
    end

    context "with more than ten members" do
      before do
        build_list(:employment, 20, company:) do |item|
          item.user = create(:user, current_workspace_id: company.id)
          item.save!
        end
        user.add_role :admin, company
        employee_user.add_role :employee, company
        sign_in(user)
      end

      it "can view pagination" do
        with_forgery_protection do
          visit "/teams"
          sleep 1
          pagination_number = find(
            "button.m-1.mx-4.p-1.text-base.font-bold.text-miru-dark-purple-400.text-miru-han-purple-1000"
          ).text

          expect(pagination_number).to eq("1")
        end
      end

      it "can paginate to the next page" do
        with_forgery_protection do
          visit "/teams"
          sleep 1
          click_button "2"

          sleep 1
          pagination_number = find(
            "button.m-1.mx-4.p-1.text-base.font-bold.text-miru-dark-purple-400.text-miru-han-purple-1000"
          ).text

          expect(pagination_number).to eq("2")
        end
      end

      it "displays ten users by default" do
        with_forgery_protection do
          visit "/teams"
          sleep 1

          within("tbody") do
            expect(page).to have_xpath(".//tr", count: 10)
          end
        end
      end

      it "can change number of users to show" do
        with_forgery_protection do
          visit "/teams"
          sleep 1

          within("tbody") do
            expect(page).to have_xpath(".//tr", count: 10)
          end

          find(".p-2.text-xs.font-bold.text-miru-han-purple-1000 option[value='20']").select_option
          sleep 1
          within("tbody") do
            expect(page).to have_xpath(".//tr", count: 20)
          end
        end
      end
    end
  end
end
