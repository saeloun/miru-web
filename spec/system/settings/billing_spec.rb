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
      visit "/settings/billing"

      expect(page).to have_current_path("/settings/billing", wait: 10)
      expect(page).to have_content("Billing", wait: 10)
      expect(page).to have_content("Manage your workspace plan", wait: 10)
      expect(page).to have_content("1/3 seats used", wait: 10)
      expect(page).to have_button("Upgrade with Stripe", wait: 10)
    end
  end

  it "shows billing portal action for paid plan" do
    company.update!(
      plan_tier: "paid",
      stripe_customer_id: "cus_test_123",
      subscription_status: "active"
    )

    with_forgery_protection do
      visit "/settings/billing"

      expect(page).to have_content("Paid", wait: 10)
      expect(page).to have_button("Manage billing in Stripe", wait: 10)
    end
  end
end
