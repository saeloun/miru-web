# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Profile avatar upload", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) do
    create(:user,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@example.com",
      password: "Password123!",
      current_workspace_id: company.id)
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "uploads a cropped avatar from profile edit" do
    with_forgery_protection do
      visit "/settings/profile/edit"
      expect(page).to have_css("#react-root", wait: 15)

      find("[data-testid='profile-image-input']", visible: false)
        .set(Rails.root.join("spec/support/fixtures/test-image.png"))

      expect(page).to have_text("Adjust profile photo", wait: 10)
      expect(page).to have_button("Save photo", disabled: false, wait: 10)
      expect(page).to have_field("Zoom", wait: 10)

      expect do
        click_button "Save photo"
        expect(page).to have_text("Avatar updated successfully", wait: 10)
      end.to change { user.reload.avatar.attached? }.from(false).to(true)
    end
  end
end
