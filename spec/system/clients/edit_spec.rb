# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Edit client", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { build(:client_with_phone_number_without_country_code, company:) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    login_as(user)
    create(:client_with_phone_number_without_country_code, company:)
  end

  context "when editing a client" do
    it "edit the client successfully" do
      with_forgery_protection do
        visit "/clients"

        find(:xpath, '//tr[@class=" hoverIcon"]').hover.click()
        find("[data-cy='three-dots']").click()
        click_button "Edit"
        fill_in "name", with: client.name
        fill_in "email", with: client.email
        fill_in "phone", with: client.phone
        fill_in "address", with: client.address
        click_button "SAVE CHANGES"

        expect(Client.last.email).to eq(client.email)
        expect(page).to have_content(client.name)
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
