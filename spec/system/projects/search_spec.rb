# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Search projects", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let!(:project1) { create(:project, client:) }

  context "when searching for a client" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "displays the matching client in the list" do
      with_forgery_protection do
        visit "/projects"
        click_link "Projects"
        sleep 2

        # Look for search input with different selectors
        if page.has_css?('input[type="search"]')
          find('input[type="search"]').fill_in with: project1.name
        elsif page.has_css?('input[placeholder*="Search"]')
          find('input[placeholder*="Search"]').fill_in with: project1.name
        else
          find("input", match: :first).fill_in with: project1.name
        end

        # Wait for search results to appear
        expect(page).to have_content(project1.name)
      end
    end

    it "displays a message when no match is found" do
      with_forgery_protection do
        visit "/projects"
        click_link "Projects"
        sleep 2

        # Look for search input with different selectors
        if page.has_css?('input[type="search"]')
          find('input[type="search"]').fill_in with: "test project"
        elsif page.has_css?('input[placeholder*="Search"]')
          find('input[placeholder*="Search"]').fill_in with: "test project"
        else
          find("input", match: :first).fill_in with: "test project"
        end

        expect(page).to have_content("No results found")
      end
    end
  end
end
