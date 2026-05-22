# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings billing", type: :system, js: true do
  let(:company) { create(:company, plan_tier: "free", billing_exempt: false) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :owner, company
    sign_in(user)
  end

  it "shows billing page with stripe upgrade action for free plan" do
    with_forgery_protection do
      visit "/dashboard"

      expect(page).to have_link("Billing", wait: 10)
      click_link "Billing"

      expect(page).to have_current_path("/settings/billing", wait: 10)
      expect(page).to have_content("Membership", wait: 10)
      expect(page).to have_content("CURRENT PLAN", wait: 10)
      expect(page).to have_content("1/3 seats used", wait: 10)
      expect(page).to have_button("Start 30-day Pro trial", wait: 10)
      expect(page).to have_button("Upgrade with Stripe", wait: 10)
      expect(page).to have_content("Hosted Enterprise", wait: 10)
      expect(page).to have_button("Monthly", wait: 10)
      expect(page).to have_button("Yearly", wait: 10)
      expect(page).to have_content("How many seats do you expect to need?", wait: 10)
      expect(page).to have_text(/Yearly discount/i, wait: 10)
      expect(page).to have_content("$1/team member/mo", wait: 10)
      click_button "Yearly"
      expect(page).to have_content("$10/team member/yr", wait: 10)
      expect(page).to have_content("Powered by Stripe", wait: 10)
      expect(page).to have_content("Reports and analytics", wait: 10)
      expect(page).to have_link("hello@saeloun.com", href: "mailto:hello@saeloun.com", wait: 10)
    end
  end

  it "explains client portal users included in seat usage" do
    client_portal_user = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: client_portal_user)
    client_portal_user.add_role :client, company

    with_forgery_protection do
      visit "/settings/billing"

      expect(page).to have_content("2/3 seats used", wait: 10)
      expect(page).to have_content("Client portal users included in seat count", wait: 10)
      expect(page).to have_content("Your seat count includes 1 client portal user(s) who have login access", wait: 10)
    end
  end

  it "shows localized billing copy in Hindi" do
    user.update!(locale: "hi")

    with_forgery_protection do
      visit "/settings/billing"

      expect(page).to have_content("सदस्यता", wait: 10)
      expect(page).to have_content("वर्तमान प्लान", wait: 10)
      expect(page).to have_content("रिपोर्ट और एनालिटिक्स", wait: 10)
      expect(page).to have_button("30-दिन का Pro ट्रायल शुरू करें", wait: 10)
      expect(page).to have_button("Stripe के साथ अपग्रेड करें", wait: 10)
    end
  end

  it "shows billing in the dashboard navigation for owners" do
    with_forgery_protection do
      visit "/dashboard"

      click_link "Billing"
      expect(page).to have_current_path("/settings/billing", wait: 10)
    end
  end

  it "hides billing from employees and blocks direct access" do
    employee = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: employee)
    employee.add_role :employee, company

    with_forgery_protection do
      sign_in(employee)
      visit "/dashboard"

      expect(page).not_to have_link("Billing")

      visit "/settings/billing"
      expect(page).to have_current_path("/error", wait: 10)
    end
  end

  it "hides billing from clients and blocks direct access" do
    client = create(:user, current_workspace_id: company.id)
    client.add_role :client, company

    with_forgery_protection do
      sign_in(client)
      visit "/dashboard"

      expect(page).not_to have_link("Billing")

      visit "/settings/billing"
      expect(page).to have_current_path("/error", wait: 10)
    end
  end

  it "hides billing from book keepers and blocks direct access" do
    book_keeper = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: book_keeper)
    book_keeper.add_role :book_keeper, company

    with_forgery_protection do
      sign_in(book_keeper)
      visit "/dashboard"

      expect(page).not_to have_link("Billing")

      visit "/settings/billing"
      expect(page).to have_current_path("/error", wait: 10)
    end
  end

  it "shows the active trial state" do
    trial_started_at = 2.days.ago.change(hour: 12)
    trial_ends_at = 28.days.from_now.change(hour: 12)

    company.update!(
      trial_started_at: trial_started_at,
      trial_ends_at: trial_ends_at
    )

    with_forgery_protection do
      visit "/settings/billing"

      expect(page).to have_content("Pro Trial", wait: 10)
      expect(page).to have_content("Pro trial active", wait: 10)
      # Date format depends on browser locale (e.g., "June 11, 2026" or "11 June 2026")
      day = trial_ends_at.day.to_s
      month = trial_ends_at.strftime("%B")
      year = trial_ends_at.strftime("%Y")
      expect(page).to have_content(day, wait: 10)
      expect(page).to have_content(month, wait: 10)
      expect(page).to have_content(year, wait: 10)
      expect(page).not_to have_button("Start 30-day Pro trial")
    end
  end

  it "shows billing portal action for paid plan" do
    company.update!(
      plan_tier: "paid",
      stripe_customer_id: "cus_test_123",
      stripe_subscription_id: "sub_test_123",
      subscription_status: "active",
      subscription_interval: "month"
    )

    with_forgery_protection do
      visit "/settings/billing"

      expect(page).to have_content("Paid", wait: 10)
      expect(page).to have_button("Manage billing in Stripe", wait: 10)
      expect(page).not_to have_button("Start 30-day Pro trial")
      expect(page).not_to have_button("Upgrade with Stripe")
      expect(page).to have_content("Monthly", wait: 10)
    end
  end
end
