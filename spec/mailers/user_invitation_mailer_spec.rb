# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserInvitationMailer, type: :mailer do
  describe "send_user_invitation" do
    let(:company) { create :company }
    let(:user) { create :user }
    let(:invitation) { create :invitation, company: }
    let(:mail) do
      UserInvitationMailer.with(
        recipient: invitation.recipient_email,
        token: invitation.token,
        user_already_exists: false,
        name: invitation.full_name
      ).send_user_invitation
    end

    it "renders the headers" do
      expect(mail.subject).to eq("You're invited to join Miru")
      expect(mail.to).to include(invitation.recipient_email)
    end

    it "renders the body" do
      expect(mail.body.encoded).to include("Accept the invite, set your password, and you are in.")
      expect(mail.body.encoded).to include("Join Miru")
      expect(mail.body.encoded).to include("hello@saeloun.com")
    end

    it "uses the recipient locale when available" do
      create(:user, email: invitation.recipient_email, locale: "te")

      localized_mail = UserInvitationMailer.with(
        recipient: invitation.recipient_email,
        token: invitation.token,
        user_already_exists: false,
        name: invitation.full_name
      ).send_user_invitation

      expect(localized_mail.subject).to eq("You're invited to join Miru")
      expect(localized_mail.body.encoded).to include("Join Miru")
      expect(localized_mail.body.encoded).not_to include("translation missing")
    end
  end
end
