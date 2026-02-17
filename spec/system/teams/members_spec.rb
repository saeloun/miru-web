# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Team Members", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, first_name: "Admin", last_name: "User", current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  context "when admin visits team page" do
    it "loads the team page and shows the React app" do
      with_forgery_protection do
        visit "/team"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "displays the Team header" do
      with_forgery_protection do
        visit "/team"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Team", wait: 10)
      end
    end

    it "shows the current admin user in the team list" do
      with_forgery_protection do
        visit "/team"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content(user.first_name, wait: 10)
      end
    end

    it "shows the New User button" do
      with_forgery_protection do
        visit "/team"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("New User", wait: 10)
      end
    end

    context "with multiple team members" do
      let!(:employee_one) do
        create(:user, first_name: "Alice", last_name: "Johnson", current_workspace_id: company.id).tap do |u|
          create(:employment, company:, user: u, designation: "Developer", employment_type: "Salaried")
          u.add_role :employee, company
        end
      end

      let!(:employee_two) do
        create(:user, first_name: "Bob", last_name: "Smith", current_workspace_id: company.id).tap do |u|
          create(:employment, company:, user: u, designation: "Designer", employment_type: "Contractor")
          u.add_role :employee, company
        end
      end

      it "displays all team members" do
        with_forgery_protection do
          visit "/team"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("Alice", wait: 10)
          expect(page).to have_content("Bob", wait: 10)
        end
      end

      it "shows team member email addresses" do
        with_forgery_protection do
          visit "/team"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content(employee_one.email, wait: 10)
          expect(page).to have_content(employee_two.email, wait: 10)
        end
      end

      it "shows team member roles" do
        with_forgery_protection do
          visit "/team"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("admin", wait: 10)
          expect(page).to have_content("employee", wait: 10)
        end
      end

      it "displays table column headers" do
        with_forgery_protection do
          visit "/team"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("USER", wait: 10)
          expect(page).to have_content("ROLE", wait: 10)
        end
      end
    end

    context "with an admin and a book_keeper" do
      let!(:book_keeper_user) do
        create(:user, first_name: "Charlie", last_name: "Keeper", current_workspace_id: company.id).tap do |u|
          create(:employment, company:, user: u)
          u.add_role :book_keeper, company
        end
      end

      it "shows both users with their respective roles" do
        with_forgery_protection do
          visit "/team"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("Admin", wait: 10)
          expect(page).to have_content("Charlie", wait: 10)
          expect(page).to have_content("book keeper", wait: 10)
        end
      end
    end
  end

  context "when employee visits team page" do
    let(:employee_user) { create(:user, first_name: "Regular", last_name: "Employee", current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee_user)
      employee_user.add_role :employee, company
      sign_in(employee_user)
    end

    it "can access the team page" do
      with_forgery_protection do
        visit "/team"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end
  end
end
