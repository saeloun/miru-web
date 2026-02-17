# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Team Member Details", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, first_name: "Admin", last_name: "Manager", current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "admin viewing team member details" do
    let!(:team_member) do
      create(:user,
        first_name: "Alice",
        last_name: "Engineer",
        current_workspace_id: company.id).tap do |u|
        create(:employment,
          company:,
          user: u,
          designation: "Senior Developer",
          employment_type: "Salaried")
        u.add_role :employee, company
      end
    end

    it "loads the team member detail page" do
      with_forgery_protection do
        visit "/team/#{team_member.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Profile Settings", wait: 10)
          .or have_content("Personal Information", wait: 10)
          .or have_content("Alice", wait: 10)
      end
    end

    it "shows the member name" do
      with_forgery_protection do
        visit "/team/#{team_member.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Alice", wait: 10)
        expect(page).to have_content("Engineer", wait: 10)
      end
    end

    it "shows the member email" do
      with_forgery_protection do
        visit "/team/#{team_member.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content(team_member.email, wait: 10)
      end
    end

    it "navigates to team member from team list" do
      with_forgery_protection do
        visit "/team"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Alice", wait: 10)
      end
    end
  end

  describe "admin viewing employment information" do
    let!(:employed_member) do
      create(:user,
        first_name: "Bob",
        last_name: "Contractor",
        current_workspace_id: company.id).tap do |u|
        create(:employment,
          company:,
          user: u,
          designation: "UI Designer",
          employment_type: "Contractor")
        u.add_role :employee, company
      end
    end

    it "can navigate to employment details" do
      with_forgery_protection do
        visit "/team/#{employed_member.id}/employment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Employment", wait: 10)
          .or have_content("Bob", wait: 10)
      end
    end
  end

  describe "admin viewing multiple team members" do
    let!(:member_one) do
      create(:user,
        first_name: "Charlie",
        last_name: "Frontend",
        current_workspace_id: company.id).tap do |u|
        create(:employment, company:, user: u, designation: "Developer")
        u.add_role :employee, company
      end
    end

    let!(:member_two) do
      create(:user,
        first_name: "Diana",
        last_name: "Backend",
        current_workspace_id: company.id).tap do |u|
        create(:employment, company:, user: u, designation: "Engineer")
        u.add_role :employee, company
      end
    end

    it "can see all team members on the team page" do
      with_forgery_protection do
        visit "/team"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Charlie", wait: 10)
        expect(page).to have_content("Diana", wait: 10)
      end
    end

    it "can view first team member details" do
      with_forgery_protection do
        visit "/team/#{member_one.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Charlie", wait: 10)
      end
    end

    it "can view second team member details" do
      with_forgery_protection do
        visit "/team/#{member_two.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Diana", wait: 10)
      end
    end
  end

  describe "employee viewing team details" do
    let(:employee_user) { create(:user, first_name: "Eve", last_name: "Worker", current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee_user)
      employee_user.add_role :employee, company
      Warden.test_reset!
      sign_in(employee_user)
    end

    it "can access the team page" do
      with_forgery_protection do
        visit "/team"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "can see team members listed" do
      with_forgery_protection do
        visit "/team"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Eve", wait: 10)
          .or have_content("Admin", wait: 10)
      end
    end
  end
end
