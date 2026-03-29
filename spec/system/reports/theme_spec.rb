# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Reports theme", type: :system, js: true do
  let!(:company) { create(:company, base_currency: "USD", name: "Reports Corp", plan_tier: "paid") }
  let!(:admin) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company
    sign_in(admin)
  end

  def computed_styles(selector)
    page.evaluate_script(<<~JS)
      (() => {
        const element = document.querySelector("#{selector}");
        if (!element) return null;
        const styles = window.getComputedStyle(element);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor
        };
      })()
    JS
  end

  it "renders reports controls in light and dark mode" do
    with_forgery_protection do
      visit "/reports"

      expect(page).to have_content("Available Reports", wait: 10)
      expect(page).to have_button("Schedule reports", wait: 10)

      light_styles = computed_styles("button")
      expect(light_styles["color"]).not_to eq(light_styles["backgroundColor"])

      page.execute_script("localStorage.setItem('theme', 'dark');")
      page.execute_script("document.documentElement.classList.add('dark');")
      visit "/reports"

      expect(page).to have_content("Available Reports", wait: 10)
      expect(page).to have_button("Schedule reports", wait: 10)

      dark_styles = computed_styles("button")
      expect(dark_styles["color"]).not_to eq(dark_styles["backgroundColor"])
      expect(dark_styles["borderColor"]).not_to eq("rgba(0, 0, 0, 0)")
    end
  end
end
