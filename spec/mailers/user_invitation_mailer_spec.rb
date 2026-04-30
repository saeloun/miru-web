# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserInvitationMailer, type: :mailer do
  describe "send_user_invitation" do
    let(:company) { create :company }
    let(:user) { create :user, current_workspace: company }
    let(:invitation) { create :invitation, company: }
    let(:company_details) do
      {
        name: company.name,
        logo: company.company_logo,
        employee_count: company.employees_without_client_role.count
      }
    end
    let(:sender_details) do
      {
        email: user.email,
        avatar: user.avatar_url,
        name: user.full_name
      }
    end
    let(:mail) do
      UserInvitationMailer.with(
        recipient: invitation.recipient_email,
        token: invitation.token,
        user_already_exists: false,
        name: invitation.full_name,
        company_details:,
        sender_details:
      ).send_user_invitation
    end
    let(:body) { mail.html_part&.body&.decoded || mail.body.decoded }

    it "renders the headers" do
      expect(mail.subject).to eq("You're invited to join Miru")
      expect(mail.to).to include(invitation.recipient_email)
    end

    it "renders the body" do
      expect(body).to include("Accept the invite, create your password, and you are in.")
      expect(body).to include("Join Miru")
      expect(body).to include("support@getmiru.com")
      expect(body).to include(company.name)
      expect(body).to include(user.full_name)
    end

    it "uses the recipient locale when available" do
      create(:user, email: invitation.recipient_email, locale: "te")

      localized_mail = UserInvitationMailer.with(
        recipient: invitation.recipient_email,
        token: invitation.token,
        user_already_exists: false,
        name: invitation.full_name,
        company_details:,
        sender_details:
      ).send_user_invitation

      expect(localized_mail.subject).to eq(
        I18n.with_locale(:te) { I18n.t("mailers.user_invitation_mailer.send_user_invitation.subject") }
      )
      localized_body = localized_mail.html_part&.body&.decoded || localized_mail.body.decoded
      expect(localized_body).to include(
        I18n.with_locale(:te) { I18n.t("mailers.user_invitation_mailer.send_user_invitation.get_started_title") }
      )
      expect(localized_body).not_to include("translation missing")
    end
  end
end
