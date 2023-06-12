# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Search clients", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client_with_phone_number_without_country_code, company:, name: "John Smith") }
  let!(:client2) { create(:client_with_phone_number_without_country_code, company:, name: "Jane Doe") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
    Client.reindex
  end

  context "when searching for a client" do
    it "displays the matching client in the list" do
      with_forgery_protection do
        visit "/clients"

        fill_in "searchInput", with: "John"
        find("#searchResult").click

        expect(page).to have_content(client1.name)
        expect(page).to have_no_content(client2.name)
      end
    end

    it "displays a message when no match is found" do
      with_forgery_protection do
        visit "/clients"

        fill_in "searchInput", with: "test client"

        expect(page).to have_content("No results found")
      end
    end
  end
end
