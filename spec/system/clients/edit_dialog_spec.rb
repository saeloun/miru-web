# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client edit dialog", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) do
    create(:client, company:, name: "Acme Labs", logo: nil, phone: "+14155552671")
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "opens the edit dialog for a client without a logo" do
    visit "/clients"

    page.all("button", text: "Open menu").first.click
    find("[role='menuitem']", text: "Edit client").click

    expect(page).to have_content("Edit Client", wait: 10)
    expect(page).to have_content("Select File")
    expect(page).to have_button("Edit Client")
    expect(page).to have_field("name", with: "Acme Labs")
    expect(page).to have_field("email")
  end

  it "updates the primary client email from the edit dialog" do
    visit "/clients"

    page.all("button", text: "Open menu").first.click
    find("[role='menuitem']", text: "Edit client").click

    fill_in "email", with: "billing@acmelabs.test"
    click_button "Edit Client"

    expect(page).to have_field("email", with: "billing@acmelabs.test", wait: 10)
    expect(client.reload.email).to eq("billing@acmelabs.test")
  end
end
