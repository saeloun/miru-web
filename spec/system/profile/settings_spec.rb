# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Profile Settings", type: :system, js: true do
  let(:company) { create(:company, name: "TestCorp", date_format: "DD-MM-YYYY") }
  let(:user) do
    create(:user,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@example.com",
      personal_email_id: "jane.personal@example.com",
      date_of_birth: Date.new(1992, 4, 10),
      social_accounts: {
        github_url: "https://github.com/janedoe",
        linkedin_url: "https://linkedin.com/in/janedoe"
      },
      current_workspace_id: company.id)
  end

  before do
    create(:employment, company:, user:, designation: "Senior Engineer", employment_type: "Salaried")
    user.add_role :admin, company
    sign_in(user)
  end

  it "shows personal profile details" do
    with_forgery_protection do
      visit "/settings/profile"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Personal Information", wait: 10)
      expect(page).to have_content("Jane", wait: 10)
      expect(page).to have_content("Doe", wait: 10)
      expect(page).to have_content("jane.doe@example.com", wait: 10)
      expect(page).to have_content("Edit Profile", wait: 10)
    end
  end

  it "boots the app in the user's saved locale" do
    user.update!(locale: "hi")

    with_forgery_protection do
      visit "/settings/profile"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("हिन्दी", wait: 10)
      expect(page).to have_content("व्यक्तिगत जानकारी", wait: 10)

      visit "/settings/preferences"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("ईमेल प्राथमिकताएं", wait: 10)
      expect(page).to have_content("साप्ताहिक टाइमशीट रिमाइंडर", wait: 10)
    end
  end

  it "shows employment details" do
    with_forgery_protection do
      visit "/settings/employment"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Current Employment", wait: 10)
    end
  end

  it "shows organization and admin setting pages" do
    with_forgery_protection do
      visit "/settings/organization"
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("TestCorp", wait: 10)

      visit "/settings/preferences"
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Email Preferences", wait: 10)
      expect(page).to have_content("Weekly Timesheet Reminder", wait: 10)

      visit "/settings/holidays"
      expect(page).to have_css("#react-root", wait: 10)

      visit "/settings/leaves"
      expect(page).to have_css("#react-root", wait: 10)

      visit "/settings/payment"
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  it "re-enables the monthly digest when resubscribing to emails" do
    with_forgery_protection do
      visit "/settings/preferences"

      expect(page).to have_css("#react-root", wait: 10)
      click_button "Unsubscribe from All Emails"
      click_button "Yes, Unsubscribe from All"
      click_button "Save Changes"

      expect(page).to have_button("Re-enable Email Notifications", wait: 10)
      click_button "Re-enable Email Notifications"

      expect(page).to have_content("Monthly Cash Flow Digest", wait: 10)
      monthly_switch = all('button[role="switch"]', wait: 10).last

      expect(monthly_switch["aria-checked"]).to eq("true")

      click_button "Save Changes"
      expect(page).to have_button("Unsubscribe from All Emails", wait: 10)
    end
  end

  it "lets an employee access personal settings pages" do
    employee_user = create(:user,
      first_name: "John",
      last_name: "Worker",
      email: "john.worker@example.com",
      current_workspace_id: company.id)
    create(:employment, company:, user: employee_user, designation: "Junior Developer", employment_type: "Contractor")
    employee_user.add_role :employee, company
    sign_in(employee_user)

    with_forgery_protection do
      visit "/settings/profile"
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("John", wait: 10)
      expect(page).to have_content("john.worker@example.com", wait: 10)

      visit "/settings/employment"
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Current Employment", wait: 10)
    end
  end

  it "lets a book keeper access personal settings pages" do
    book_keeper_user = create(:user,
      first_name: "Ava",
      last_name: "Finance",
      email: "ava.finance@example.com",
      current_workspace_id: company.id)
    create(:employment, company:, user: book_keeper_user, designation: "Book Keeper", employment_type: "Salaried")
    book_keeper_user.add_role :book_keeper, company
    sign_in(book_keeper_user)

    with_forgery_protection do
      visit "/settings/profile"
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Ava", wait: 10)
      expect(page).to have_content("ava.finance@example.com", wait: 10)

      visit "/settings/employment"
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Current Employment", wait: 10)
    end
  end

  it "shows passkey controls on the security settings card" do
    with_forgery_protection do
      visit "/settings/profile/edit"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Passkeys", wait: 10)
      expect(page).to have_content("Add a passkey for this account", wait: 10)
      expect(page).to have_button("Add passkey", wait: 10)
      expect(page).to have_content("Require passkey on sign in", wait: 10)
      expect(page).to have_content("Authenticator App 2FA", wait: 10)
      expect(page).to have_button("Set up 2FA", wait: 10)
    end
  end

  it "prefills existing values on the profile edit page" do
    with_forgery_protection do
      visit "/settings/profile/edit"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_field("first_name", with: "Jane", wait: 10)
      expect(page).to have_field("last_name", with: "Doe")
      expect(page).to have_field("email_id", with: "jane.personal@example.com")
      expect(page).to have_field("date_of_birth", with: "10-04-1992")
      expect(page).to have_field("linkedin", with: "https://linkedin.com/in/janedoe")
      expect(page).to have_field("github", with: "https://github.com/janedoe")
    end
  end

  it "shows a saved date of birth on the profile summary" do
    with_forgery_protection do
      response = page.evaluate_async_script(<<~JS, "1993-11-12T00:00:00.000Z")
        const [dateOfBirth, done] = arguments;

        fetch("/api/v1/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          credentials: "same-origin",
          body: JSON.stringify({ user: { date_of_birth: dateOfBirth } })
        })
          .then(async response => {
            const data = await response.json();
            done({ ok: response.ok, status: response.status, data });
          })
          .catch(error => done({ ok: false, error: String(error) }));
      JS

      expect(response["ok"]).to eq(true)

      visit "/settings/profile"

      expect(page).to have_current_path("/settings/profile", wait: 10)
      expect(page).to have_content("Born November 12, 1993", wait: 10)
      expect(page).not_to have_content("Born Invalid Date", wait: 5)
    end
  end

  it "hides billing notification controls for employees" do
    employee_user = create(:user,
      first_name: "John",
      last_name: "Worker",
      email: "john.worker@example.com",
      current_workspace_id: company.id)
    create(:employment, company:, user: employee_user, designation: "Junior Developer", employment_type: "Contractor")
    employee_user.add_role :employee, company
    sign_in(employee_user)

    with_forgery_protection do
      visit "/settings/preferences"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Weekly Timesheet Reminder", wait: 10)
      expect(page).to have_content("Missing Entry Reminders", wait: 10)
      expect(page).not_to have_content("Billing Notifications")
      expect(page).not_to have_content("Invoice Email Notifications")
      expect(page).not_to have_content("Payment Email Notifications")
    end
  end
end
