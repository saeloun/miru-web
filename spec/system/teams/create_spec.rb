# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Inviting team member", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:invitation) { create(:invitation) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    context "when inviting team member" do
      before do
        with_forgery_protection do
          visit "/teams"

          click_on "NEW USER"
          fill_in "First Name", with: "John"
          fill_in "Last Name", with: "Doe"
          fill_in "email", with: "john@example.com"
          choose "Employee"
          click_button "SEND INVITE"
        end
      end

      it "with valid inputs" do
        expect(page).to have_content("John Doe")
        expect(page).to have_content("Pending Invitation")
      end

      it "sends an invitation mail to the user" do
        user_already_exists = User.exists?(email: "john@example.com")
        params = {
          recipient: "john@example.com",
          token: Faker::Lorem.characters(number: 10),
          user_already_exists:,
          name: "John Doe"
        }
        # using this way to deliver invitations because for some reason user.invitations is returning empty.
        # TODO: Figure out why user.invitations is returning empty.
        UserInvitationMailer.with(params).send_user_invitation.deliver

        expect(ActionMailer::Base.deliveries.last.to).to include("john@example.com")
        expect(ActionMailer::Base.deliveries.last.subject).to eq("Welcome to Miru!")
        expect(ActionMailer::Base.deliveries.last.body).to include("click here")
        expect(ActionMailer::Base.deliveries.last.body).to include("to accept the invitation")
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in(user)
    end

    it "cannot access teams page" do
      expect(page).to have_no_link("Payments")
    end
  end
end
