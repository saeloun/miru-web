# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Delete client", type: :system do
  let(:company) { create(:company) }
  let!(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    login_as(user)
  end

  context "when deleting a client" do
    it "delete the client successfully" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_content(client.name)

        find(:css, ".hoverIcon").hover.click
        find("#kebabMenu").click()
        click_button "Delete"
        click_button "DELETE"

        expect(page).not_to have_content(client.name)
      end
    end
  end
end
