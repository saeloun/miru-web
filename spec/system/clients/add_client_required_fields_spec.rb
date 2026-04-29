# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Add client required field guidance", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  def open_add_client_dialog
    visit "/clients"
    click_button "Add New Client"
    expect(page).to have_selector("[role='dialog']", wait: 10)
  end

  it "shows and updates the missing required fields summary on desktop", :aggregate_failures do
    open_add_client_dialog

    expect(page).to have_text(
      /Missing required fields:\s*Name, Address line 1, Country, State, City, Zipcode, Currency/
    )
    expect(page).to have_button("Add New Client", disabled: true)

    fill_in "Name *", with: "Acme QA Client"

    expect(page).to have_text(
      /Missing required fields:\s*Address line 1, Country, State, City, Zipcode, Currency/
    )
  end

  it "shows and updates the missing required fields summary on mobile", :aggregate_failures do
    page.current_window.resize_to(390, 844)
    open_add_client_dialog

    expect(page).to have_text(
      /Missing required fields:\s*Name, Address line 1, Country, State, City, Zipcode, Currency/
    )
    expect(page).to have_button("Add New Client", disabled: true)

    fill_in "Name *", with: "Acme QA Client Mobile"

    expect(page).to have_text(
      /Missing required fields:\s*Address line 1, Country, State, City, Zipcode, Currency/
    )
  end
end
