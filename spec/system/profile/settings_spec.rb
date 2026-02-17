# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Profile Settings", type: :system, js: true do
  let(:company) { create(:company, name: "TestCorp") }
  let(:user) do
    create(:user,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@example.com",
      current_workspace_id: company.id)
  end

  before do
    create(:employment, company:, user:, designation: "Senior Engineer", employment_type: "Salaried")
    user.add_role :admin, company
    sign_in(user)
  end

  context "when admin visits personal profile settings" do
    it "loads the profile settings page and shows the React app" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "displays the profile page heading" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Personal Details", wait: 10)
      end
    end

    it "shows the user first and last name" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Jane", wait: 10)
        expect(page).to have_content("Doe", wait: 10)
      end
    end

    it "shows the user email" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("jane.doe@example.com", wait: 10)
      end
    end

    it "displays the Personal Information section" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Personal Information", wait: 10)
      end
    end

    it "shows the Edit Profile button" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Edit Profile", wait: 10)
      end
    end
  end

  context "when admin visits employment details" do
    it "loads the employment details page" do
      with_forgery_protection do
        visit "/settings/employment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Employment Details", wait: 10)
      end
    end
  end

  context "when admin visits organization settings" do
    it "loads the organization settings page" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "displays the company name" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("TestCorp", wait: 10)
      end
    end
  end

  context "when admin visits other settings pages" do
    it "loads the holidays settings page" do
      with_forgery_protection do
        visit "/settings/holidays"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "loads the leaves settings page" do
      with_forgery_protection do
        visit "/settings/leaves"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "loads the payment settings page" do
      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end
  end

  context "when employee visits profile settings" do
    let(:employee_user) do
      create(:user,
        first_name: "John",
        last_name: "Worker",
        email: "john.worker@example.com",
        current_workspace_id: company.id)
    end

    before do
      create(:employment, company:, user: employee_user, designation: "Junior Developer", employment_type: "Contractor")
      employee_user.add_role :employee, company
      sign_in(employee_user)
    end

    it "can access the personal profile page" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Personal Details", wait: 10)
      end
    end

    it "shows the employee name on the profile page" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("John", wait: 10)
        expect(page).to have_content("Worker", wait: 10)
      end
    end

    it "shows the employee email" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("john.worker@example.com", wait: 10)
      end
    end

    it "can access employment details" do
      with_forgery_protection do
        visit "/settings/employment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Employment Details", wait: 10)
      end
    end
  end
end
