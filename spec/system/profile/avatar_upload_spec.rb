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

  def upload_avatar
    find("[data-testid='profile-image-input']", visible: false)
      .set(Rails.root.join("spec/support/fixtures/test-image.png"))

    expect(page).to have_text("Adjust profile photo", wait: 10)
    expect(page).to have_button("Apply photo", disabled: false, wait: 10)
    expect(page).to have_field("Zoom", wait: 10)
    click_button "Apply photo"
    expect(page).to have_text(I18n.t("avatar.update.success"), wait: 10)
  end

  it "uploads and reapplies a cropped avatar from profile edit" do
    with_forgery_protection do
      visit "/settings/profile/edit"
      expect(page).to have_css("#react-root", wait: 15)

      expect { upload_avatar }.to change { user.reload.avatar.attached? }
        .from(false).to(true)

      find("[data-testid='profile-image-edit-trigger']").click
      upload_avatar
      expect(user.reload.avatar.attached?).to be(true)
    end
  end

  it "removes avatar after uploading from profile edit" do
    with_forgery_protection do
      visit "/settings/profile/edit"
      expect(page).to have_css("#react-root", wait: 15)

      upload_avatar
      expect(user.reload.avatar.attached?).to be(true)

      click_button "Remove photo"
      expect(page).to have_text(I18n.t("avatar.destroy.success"), wait: 10)
      expect(user.reload.avatar.attached?).to be(false)
    end
  end
end
