# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client invoices list", type: :system, js: true do
  let(:company) { create(:company) }
  let(:client_user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Client Portal Co") }

  before do
    create(:client_member, company:, client:, user: client_user)
    create(:employment, company:, user: client_user)
    client_user.add_role :client, company
    sign_in(client_user)
  end

  it "loads more invoices on scroll" do
    create_list(
      :invoice,
      26,
      company:,
      client:,
      status: "sent"
    )

    with_forgery_protection do
      visit "/invoices"

      expect(page).to have_content("Showing 20 of 26", wait: 10)

      page.execute_script("window.scrollTo(0, document.body.scrollHeight)")

      expect(page).to have_content("Showing 26 of 26", wait: 10)
      expect(page).to have_content("All invoices loaded", wait: 10)
    end
  end
end
