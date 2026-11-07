# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Private invitation confirmation", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Onboarding QA") }
  let!(:invitation) { create(:invitation, company:, first_name: "Taylor", last_name: "Candidate", recipient_email: "synthetic-onboarding@example.test") }

  before do
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
  end

  around { |example| with_forgery_protection { example.run } }
  after { expect(@console_errors).to eq([]) }

  def capture(name)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["INVITATION_SHOTS"]

    folder = Rails.root.join(ENV.fetch("INVITATION_SHOTS"))
    FileUtils.mkdir_p(folder)
    page.save_screenshot(folder.join("#{name}.png"), full: true)
  end

  it "waits for keyboard confirmation before creating a member and lets them set a password" do
    page.current_window.resize_to(1440, 900)
    visit invitations_accepts_path(token: invitation.token)
    expect(page).to have_text("Join Synthetic Onboarding QA")
    expect(page).to have_button("Accept invitation")
    expect(User.exists?(email: invitation.recipient_email)).to be(false)
    expect(invitation.reload.accepted_at).to be_nil
    expect(page).to have_no_css("script", visible: :all)
    capture("confirmation-desktop")
    page.current_window.resize_to(390, 844)
    capture("confirmation-mobile")
    find_button("Accept invitation").native.node.focus
    page.driver.browser.keyboard.type(:space)

    expect(page).to have_current_path(/\/users\/password\/edit\?reset_password_token=/)
    expect(page).to have_text("Reset Password")
    fill_in "password", with: "Password1!"
    fill_in "confirm_password", with: "Password1!"
    click_button "Reset Password"
    expect(page).to have_current_path("/").or have_current_path("/dashboard").or have_current_path("/time-tracking")
    expect(invitation.reload.accepted_at).to be_present
    expect(User.find_by!(email: invitation.recipient_email).valid_password?("Password1!")).to be(true)
  end

  it "preserves an existing account until confirmation and then opens the normal sign-in page" do
    user = create(:user, email: invitation.recipient_email, password: "Password1!")
    original_workspace = user.current_workspace_id
    visit invitations_accepts_path(token: invitation.token)
    expect(page).to have_button("Accept invitation")
    expect(user.reload.current_workspace_id).to eq(original_workspace)
    expect(company.employments.where(user:)).not_to exist
    click_button "Accept invitation"
    expect(page).to have_current_path(new_user_session_path)
    expect(user.reload.valid_password?("Password1!")).to be(true)
    expect(user.active_for_authentication?).to be(true)
    type_login_field("email", user.email)
    type_login_field("password", "Password1!")
    capture("existing-member-sign-in")
    click_button "Sign in"
    expect(page).to have_current_path("/").or have_current_path("/dashboard").or have_current_path("/time-tracking")
    expect(user.reload.current_workspace_id).to eq(company.id)
    expect(invitation.reload.accepted_at).to be_present
  end

  it "shows an actionable error for the wrong signed-in account without disclosing the invitation" do
    sign_in create(:user)
    visit invitations_accepts_path(token: invitation.token)
    expect(page).to have_text("Sign out of the other account")
    expect(page).to have_no_button("Accept invitation")
    expect(page).to have_no_text(company.name)
    expect(page).to have_no_text(invitation.recipient_email)
    expect(invitation.reload.accepted_at).to be_nil
    capture("wrong-account")
  end

  it "rejects an invitation that expires after opening the confirmation page" do
    page.current_window.resize_to(390, 844)
    visit invitations_accepts_path(token: invitation.token)
    expect(page).to have_button("Accept invitation")
    invitation.update!(expired_at: 1.minute.ago)
    click_button "Accept invitation"
    expect(page).to have_text("Invitation expired")
    expect(page).to have_no_button("Accept invitation")
    expect(User.exists?(email: invitation.recipient_email)).to be(false)
    expect(invitation.reload.accepted_at).to be_nil
    capture("expired-after-review-mobile")
  end

  it "rejects a native form POST with its authenticity token removed" do
    visit invitations_accepts_path(token: invitation.token)
    expect(page).to have_button("Accept invitation")
    page.execute_script('document.querySelector("input[name=authenticity_token]").remove()')
    click_button "Accept invitation"
    expect(page).to have_text("The confirmation page expired")
    expect(page).to have_no_button("Accept invitation")
    expect(User.exists?(email: invitation.recipient_email)).to be(false)
    expect(invitation.reload.accepted_at).to be_nil
    capture("csrf-rejected")
  end
end
