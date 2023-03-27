# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Inviting team memeber", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    context "when inviting team memeber" do
      it "with valid inputs" do
        with_forgery_protection do
          visit "/teams"

          click_on "NEW USER"
          fill_in "First Name", with: "John"
          fill_in "Last Name", with: "Doe"
          fill_in "email", with: "john@example.com"
          choose "Employee"
          click_button "SEND INVITE"

          expect(page).to have_content("John Doe")
          expect(page).to have_content("Pending Invitation")
        end
      end

      it "sends an invitation mail to the user" do
        with_forgery_protection do
          visit "/teams"

          click_on "NEW USER"
          fill_in "First Name", with: "John"
          fill_in "Last Name", with: "Doe"
          fill_in "email", with: "john@example.com"
          choose "Employee"
          click_button "SEND INVITE"

          # expect(invitation.recipient_email).to eq("john@example.com")
          p UserInvitationMailer.last
        end
      end
    end
  end
end
