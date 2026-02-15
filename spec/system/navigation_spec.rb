# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Application Navigation", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    create(:project_member, user:, project:)
    sign_in(user)
  end

  it "navigates to time tracking" do
    with_forgery_protection do
      visit "/time-tracking"

      expect(page).to have_current_path("/time-tracking", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  it "navigates to clients page" do
    with_forgery_protection do
      visit "/clients"

      expect(page).to have_current_path("/clients", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  it "navigates to projects page" do
    with_forgery_protection do
      visit "/projects"

      expect(page).to have_current_path("/projects", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  it "navigates to invoices page" do
    with_forgery_protection do
      visit "/invoices"

      expect(page).to have_current_path("/invoices", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  it "navigates to reports page" do
    with_forgery_protection do
      visit "/reports"

      expect(page).to have_current_path("/reports", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  it "navigates to payments page" do
    with_forgery_protection do
      visit "/payments"

      expect(page).to have_current_path("/payments", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  it "navigates to team page" do
    with_forgery_protection do
      visit "/team"

      expect(page).to have_current_path("/team", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  it "navigates to settings" do
    with_forgery_protection do
      visit "/settings/profile"

      expect(page).to have_current_path("/settings/profile", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end
end
