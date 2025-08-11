# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Search projects", type: :system do
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

        fill_in "searchInput", with: project1.name
        find("#searchResult").click

        expect(page).to have_content(project1.name)
      end
    end

    it "displays a message when no match is found" do
      with_forgery_protection do
        visit "/projects"

        fill_in "searchInput", with: "test project"

        expect(page).to have_content("No results found")
      end
    end
  end
end
