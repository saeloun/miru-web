# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings - Devices", type: :system, js: true do
  let(:company) { create(:company, name: "Devices Corp") }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: owner)
    create(:employment, company:, user: employee)
    owner.add_role :owner, company
    employee.add_role :employee, company
  end

  it "lets an owner add a device from the empty state" do
    sign_in(owner)

    visit "/settings/devices"
    click_on "Add Devices"

    expect(page).to have_current_path("/settings/devices/edit", wait: 10)
    find("h3", text: "Add Another Device").click
    find("#device-type-0", wait: 10).click
    find("[role='option']", text: "Laptop").click
    fill_in "Model/Name", with: "MacBook Pro"
    fill_in "Serial Number", with: "MBP-001"
    fill_in "Memory (RAM)", with: "16GB"
    fill_in "Processor", with: "M3 Pro"
    click_on "Save Changes"

    expect(page).to have_current_path("/settings/devices", wait: 10)
    expect(page).to have_content("MacBook Pro", wait: 10)
    expect(page).to have_content("MBP-001", wait: 10)
  end

  it "shows an employee only their own devices" do
    create(:device, user_id: employee.id, company_id: company.id, name: "Employee Laptop")
    create(:device, user_id: owner.id, company_id: company.id, name: "Owner Laptop")

    sign_in(employee)
    visit "/settings/devices"

    expect(page).to have_content("Employee Laptop", wait: 10)
    expect(page).not_to have_content("Owner Laptop")
  end
end
