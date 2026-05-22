# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Cookie-backed browser authentication", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
  end

  it "clears legacy localStorage credentials and bootstraps from the Rails session" do
    with_forgery_protection do
      load_login_page

      page.execute_script(<<~JS, user.token, user.email)
        window.localStorage.setItem("authToken", JSON.stringify(arguments[0]));
        window.localStorage.setItem("authEmail", JSON.stringify(arguments[1]));
      JS

      login_as(user, scope: :user)
      visit "/dashboard"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Welcome back", wait: 10)
      expect(page.evaluate_script("window.localStorage.getItem('authToken')")).to be_nil
      expect(page.evaluate_script("window.localStorage.getItem('authEmail')")).to be_nil
    end
  end
end
