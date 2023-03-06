# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Edit client", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) { create(:client_with_phone_number_without_country_code, company:) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    login_as(user)
  end

  context "when editing a client" do
    it "edit the client successfully" do
      with_forgery_protection do
        visit "/clients"

        find(:xpath, '//tr[@class=" hoverIcon"]').hover.click()
        find("[data-cy='three-dots']").click()
        click_button "Edit"
        fill_in "name", with: "test client"
        fill_in "email", with: "client@test.com"
        fill_in "phone", with: "9123456789"
        fill_in "address", with: "New York"
        click_button "SAVE CHANGES"

        expect(page).to have_content("test client")

        client.reload

        expect(client.name).to eq("test client")
        expect(client.email).to eq("client@test.com")
      end
    end
  end

  context "when editing client with invalid values" do
    it "throws error when entering invalid email" do
      with_forgery_protection do
        visit "/clients"

        find(:xpath, '//tr[@class=" hoverIcon"]').hover.click()
        find("[data-cy='three-dots']").click()
        click_button "Edit"
        fill_in "email", with: " "
        click_button "SAVE CHANGES"

        expect(page).to have_content("Invalid email ID")
      end
    end
  end
end
