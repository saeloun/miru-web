# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserInvitationMailer, type: :mailer do
  describe "send_user_invitation" do
    let(:company) { create :company }
    let(:user) { create :user }
    let(:invitation) { create :invitation, company: }
    let(:mail) { UserInvitationMailer.with(
      recipient: invitation.recipient_email,
      token: invitation.token,
      user_already_exists: false,
      name: invitation.full_name
    ).send_user_invitation
}

    it "renders the headers" do
      expect(mail.subject).to eq("You're invited to join Miru")
      expect(mail.to).to include(invitation.recipient_email)
    end

    it "renders the body" do
      expect(mail.body.encoded).to include("Accept the invitation, set your password, and join the workspace in a few minutes.")
      expect(mail.body.encoded).to include("Join Miru")
      expect(mail.body.encoded).to include("hello@saeloun.com")
    end
  end
end
