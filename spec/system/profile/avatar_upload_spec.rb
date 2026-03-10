# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Profile avatar upload", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) do
    create(:user,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@example.com",
      password: "password",
      current_workspace_id: company.id)
  end

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
    sign_in(user)
  end

  it "opens the crop dialog for avatar upload" do
    with_forgery_protection do
      visit "/dashboard"
      click_link "Profile"
      expect(page).to have_button("Edit Profile", wait: 10)
      page.execute_script(<<~JS)
        Array.from(document.querySelectorAll("button"))
          .find(button => button.textContent.includes("Edit Profile"))
          ?.click()
      JS

      find("[data-testid='profile-image-input']", visible: false)
        .set(Rails.root.join("tmp/manual-fixtures/vipul.webp"))

      expect(page).to have_css("[role='dialog']", wait: 10)
      expect(page).to have_button("Save photo", disabled: false, wait: 10)
      expect(page).to have_css("[role='dialog'] img", wait: 10)
    end
  end
end
