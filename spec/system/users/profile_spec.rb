# frozen_string_literal: true

require "rails_helper"

RSpec.describe "User profile management", type: :system, js: true do
  let(:company) { create(:company, name: "Acme Corp") }
  let(:user) do
    create(:user,
      first_name: "Alice",
      last_name: "Martin",
      email: "alice.martin@example.com",
      current_workspace_id: company.id)
  end

  before do
    create(:employment, company:, user:, designation: "Lead Engineer", employment_type: "Salaried")
    user.add_role :admin, company
    sign_in(user)
  end

  context "when admin views personal profile" do
    it "loads the profile page with React app" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "shows the user first name and last name" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Alice", wait: 10)
        expect(page).to have_content("Martin", wait: 10)
      end
    end

    it "shows the user email address" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("alice.martin@example.com", wait: 10)
      end
    end

    it "displays the Personal Details heading" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Personal Details", wait: 10)
      end
    end
  end

  context "when admin navigates to employment details" do
    it "loads the employment details page" do
      with_forgery_protection do
        visit "/settings/employment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Employment Details", wait: 10)
      end
    end
  end

  context "when admin accesses organization settings" do
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
        expect(page).to have_content("Acme Corp", wait: 10)
      end
    end
  end

  context "when employee accesses profile" do
    let(:employee) do
      create(:user,
        first_name: "Bob",
        last_name: "Jenkins",
        email: "bob.jenkins@example.com",
        current_workspace_id: company.id)
    end

    before do
      create(:employment, company:, user: employee, designation: "Junior Developer", employment_type: "Contractor")
      employee.add_role :employee, company
      Warden.test_reset!
      sign_in(employee)
    end

    it "can view the personal profile page" do
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
        expect(page).to have_content("Bob", wait: 10)
        expect(page).to have_content("Jenkins", wait: 10)
      end
    end

    it "shows the employee email on the profile page" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("bob.jenkins@example.com", wait: 10)
      end
    end

    it "can access employment details" do
      with_forgery_protection do
        visit "/settings/employment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Employment Details", wait: 10)
      end
    end

    it "is redirected or restricted when accessing organization settings" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).not_to have_content("Organization Settings", wait: 5)
      end
    end
  end
end
