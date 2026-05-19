# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Stored auth token fallback", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
  end

  it "bootstraps the SPA when only local storage credentials are present" do
    with_forgery_protection do
      visit "/login"
      wait_for_react_app

      page.execute_script(<<~JS, user.token, user.email)
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.localStorage.setItem("authToken", JSON.stringify(arguments[0]));
        window.localStorage.setItem("authEmail", JSON.stringify(arguments[1]));
      JS

      visit "/expenses"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Expenses", wait: 10)
      expect(page).not_to have_current_path("/user/sign_in", ignore_query: true)
    end
  end

  it "preserves the stored token during a cookie-backed bootstrap" do
    with_forgery_protection do
      visit "/login"
      wait_for_react_app

      page.execute_script(<<~JS, user.token, user.email)
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.localStorage.setItem("authToken", JSON.stringify(arguments[0]));
        window.localStorage.setItem("authEmail", JSON.stringify(arguments[1]));
      JS

      login_as(user, scope: :user)
      visit "/dashboard"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page.evaluate_script("JSON.parse(window.localStorage.getItem('authToken'))")).to eq(user.token)
      expect(page.evaluate_script("JSON.parse(window.localStorage.getItem('authEmail'))")).to eq(user.email)
    end
  end

  it "replaces the legacy session marker with a durable token when the Rails session is still valid" do
    with_forgery_protection do
      visit "/login"
      wait_for_react_app

      page.execute_script(<<~JS, user.email)
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.localStorage.setItem("authToken", JSON.stringify("session"));
        window.localStorage.setItem("authEmail", JSON.stringify(arguments[0]));
      JS

      login_as(user, scope: :user)
      visit "/dashboard"

      expect(page).to have_content("Welcome back", wait: 10)
      expect(page.evaluate_script("JSON.parse(window.localStorage.getItem('authToken'))")).to eq(user.token)
      expect(page.evaluate_script("JSON.parse(window.localStorage.getItem('authEmail'))")).to eq(user.email)
    end
  end
end
