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

      it "shows the full team without pagination" do
        with_forgery_protection do
          visit "/team"

          expect(page).to have_content("Total Members", wait: 10)
          expect(page).to have_content("2", wait: 10)
          expect(page).not_to have_content("Page 1 of")
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

      it "shows the full team list without pagination controls" do
        with_forgery_protection do
          visit "/team"

          expect(page).to have_content("Total Members", wait: 10)
          expect(page).to have_content("22", wait: 10)
          expect(page).not_to have_content("Page 1 of")
        end
      end

      it "shows team table with members" do
        with_forgery_protection do
          visit "/team"
          expect(page).to have_content("Team", wait: 10)
          expect(page).to have_content("Role", wait: 10)
        end
      end
    end

    context "when free plan seat limit is reached" do
      let(:company) { create(:company, plan_tier: "free") }

      before do
        create(:employment, company:, user:)
        create(:employment, company:, user: employee_user)
        extra_user = create(:user, current_workspace_id: company.id)
        create(:employment, company:, user: extra_user)
        user.add_role :admin, company
        employee_user.add_role :employee, company
        extra_user.add_role :employee, company
        sign_in(user)
      end

      it "disables inviting more members and prompts an upgrade" do
        with_forgery_protection do
          visit "/team"

          expect(page).to have_button("Upgrade to add more members", wait: 10)
        end
      end
    end

    context "when editing a team member profile" do
      before do
        create(:employment, company:, user:)
        create(:employment, company:, user: employee_user)
        user.add_role :admin, company
        employee_user.add_role :employee, company
        sign_in(user)
      end

      it "prefills the member details form" do
        with_forgery_protection do
          visit "/team/#{employee_user.id}/profile/edit"

          expect(page).to have_field("first_name", with: employee_user.first_name, wait: 10)
          expect(page).to have_field("last_name", with: employee_user.last_name)
          expect(page).to have_field("email_id", with: employee_user.personal_email_id)
        end
      end
    end

    context "when deleting a team member" do
      before do
        create(:employment, company:, user:)
        create(:employment, company:, user: employee_user)
        user.add_role :admin, company
        employee_user.add_role :employee, company
        sign_in(user)
      end

      it "removes the team member from the table" do
        with_forgery_protection do
          visit "/team"

          expect(page).to have_content(employee_user.email, wait: 10)

          find("tr", text: employee_user.email, wait: 10).find("button", text: "Open menu").click

          find("[role='menuitem']", text: "Delete User", wait: 10).click
          within("[role='dialog']") do
            click_on "Delete"
          end

          expect(page).to have_no_content(employee_user.email, wait: 10)
        end
      end

      it "opens the delete confirmation with stable member copy" do
        with_forgery_protection do
          visit "/team"

          expect(page).to have_content(employee_user.email, wait: 10)

          page.execute_script(<<~JS)
            window.__teamDeleteDialogTexts = [];
            new MutationObserver(() => {
              const dialog = document.querySelector("[role='dialog']");
              if (dialog) window.__teamDeleteDialogTexts.push(dialog.innerText);
            }).observe(document.body, {
              childList: true,
              characterData: true,
              subtree: true
            });
          JS

          find("tr", text: employee_user.email, wait: 10).find("button", text: "Open menu").click
          find("[role='menuitem']", text: "Delete User", wait: 10).click

          within("[role='dialog']") do
            expect(page).to have_text(
              "Are you sure you want to delete user #{employee_user.full_name}? This action cannot be reversed.",
              wait: 10
            )
            expect(page).to have_no_text("Checking active assignments")
            expect(page).to have_no_text("undefined")
            expect(page).to have_no_text("%{name}")
          end

          observed_text = page.evaluate_script("window.__teamDeleteDialogTexts.join('\\n')")

          expect(observed_text).to include(employee_user.full_name)
          expect(observed_text).not_to include("Checking active assignments")
          expect(observed_text).not_to include("undefined")
          expect(observed_text).not_to include("%{name}")
        end
      end
    end
  end
end
