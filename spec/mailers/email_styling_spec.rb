# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Email Styling", type: :mailer do
  # Helper method to get HTML body from mail object
  def get_html_body(mail)
    mail.html_part ? mail.html_part.body.to_s : mail.body.to_s
  end

  describe "CSS inlining with premailer-rails" do
    let(:company) { create :company }
    let(:user) { create :user, current_workspace_id: company.id }

    describe "UserInvitationMailer" do
      let(:invitation) { create :invitation, company: }
      let(:mail) do
        UserInvitationMailer.with(
          recipient: invitation.recipient_email,
          token: invitation.token,
          user_already_exists: false,
          name: invitation.full_name,
          sender_details: {
            name: user.full_name,
            email: user.email,
            avatar: nil
          },
          company_details: {
            name: company.name,
            employee_count: 10,
            logo: nil
          }
        ).send_user_invitation
      end

      it "contains inline styles" do
        html_body = get_html_body(mail)

        # Check that premailer has inlined styles
        expect(html_body).to include("style=")
      end

      it "has purple branding color" do
        html_body = get_html_body(mail)

        # Check for the primary brand color
        expect(html_body).to include("#5B34EA")
      end

      it "has styled banner" do
        html_body = get_html_body(mail)

        # Check for banner styling
        expect(html_body).to match(/background.*#5B34EA/i)
      end

      it "has styled call-to-action button" do
        html_body = get_html_body(mail)

        # Check for button with proper styling
        expect(html_body).to include("Join Miru")
        expect(html_body).to match(/border-radius.*20px/i)
      end

      it "has About Miru section with dark background" do
        html_body = get_html_body(mail)

        # Check for About Miru section with gradient background
        expect(html_body).to include("About Miru")
        expect(html_body).to match(/(background-color|background-image).*#453E75/i)
      end

      it "includes footer" do
        html_body = get_html_body(mail)

        expect(html_body).to include("Miru")
        expect(html_body).to include("All rights reserved")
      end
    end

    describe "SendWeeklyReminderToUserMailer" do
      let(:start_date) { 1.week.ago.beginning_of_week }
      let(:end_date) { 1.week.ago.end_of_week }
      let(:mail) do
        SendWeeklyReminderToUserMailer.with(
          recipients: user.email,
          company_name: company.name,
          name: user.full_name,
          start_date:,
          end_date:
        ).notify_user_about_missed_entries
      end

      it "contains inline styles" do
        html_body = get_html_body(mail)

        # Check that premailer has inlined styles
        expect(html_body).to include("style=")
      end

      it "has purple branding color" do
        html_body = get_html_body(mail)

        # Check for the primary brand color
        expect(html_body).to include("#5B34EA")
      end

      it "has styled banner with image" do
        html_body = get_html_body(mail)

        # Check for banner styling
        expect(html_body).to match(/background.*#5B34EA/i)
        expect(html_body).to match(/Banner-[a-f0-9]+\.png/)
      end

      it "has styled header" do
        html_body = get_html_body(mail)

        expect(html_body).to include("Reminder to Update your Timesheet on Miru")
        expect(html_body).to match(/font-size.*24px/i)
      end

      it "has highlighted date range box" do
        html_body = get_html_body(mail)

        # Check for highlight box styling
        expect(html_body).to match(/background.*#F5F3FF/i)
      end

      it "has styled call-to-action button" do
        html_body = get_html_body(mail)

        expect(html_body).to include("Update Timesheet")
        expect(html_body).to match(/background.*#5B34EA/i)
      end

      it "uses proper URL for time-tracking link" do
        html_body = get_html_body(mail)

        # Check that the link is properly formatted without double slashes
        expect(html_body).to include("time-tracking")
        expect(html_body).to match(%r{https?://[^/]+/time-tracking})
        expect(html_body).not_to match(%r{//time-tracking})
      end
    end

    describe "Devise Confirmation Instructions Email" do
      let(:mail) do
        user.send_confirmation_instructions
        ActionMailer::Base.deliveries.last
      end

      before do
        ActionMailer::Base.deliveries.clear
      end

      it "contains inline styles" do
        html_body = get_html_body(mail)

        # Check that premailer has inlined styles
        expect(html_body).to include("style=")
      end

      it "has purple branding color" do
        html_body = get_html_body(mail)

        # Check for the primary brand color
        expect(html_body).to include("#5B34EA")
      end

      it "has styled banner" do
        html_body = get_html_body(mail)

        # Check for banner styling
        expect(html_body).to match(/background.*#5B34EA/i)
        expect(html_body).to match(/Banner-[a-f0-9]+\.png/)
      end

      it "has styled confirmation button" do
        html_body = get_html_body(mail)

        expect(html_body).to include("Confirm my email address")
        expect(html_body).to match(/border-radius.*20px/i)
      end

      it "has proper header styling" do
        html_body = get_html_body(mail)

        expect(html_body).to include("Welcome to Miru!")
        expect(html_body).to match(/font-size.*24px/i)
      end

      it "includes feature list" do
        html_body = get_html_body(mail)

        expect(html_body).to include("Send professional invoices")
        expect(html_body).to include("Manage your team")
      end

      it "includes footer" do
        html_body = get_html_body(mail)

        expect(html_body).to include("All rights reserved")
      end
    end

    describe "Devise Password Reset Email" do
      let(:mail) do
        user.send_reset_password_instructions
        ActionMailer::Base.deliveries.last
      end

      before do
        ActionMailer::Base.deliveries.clear
      end

      it "contains inline styles" do
        html_body = get_html_body(mail)

        # Check that premailer has inlined styles
        expect(html_body).to include("style=")
      end

      it "has purple branding color" do
        html_body = get_html_body(mail)

        # Check for the primary brand color
        expect(html_body).to include("#5B34EA")
      end

      it "has styled banner" do
        html_body = get_html_body(mail)

        # Check for banner styling
        expect(html_body).to match(/background.*#5B34EA/i)
        expect(html_body).to match(/Password_Banner-[a-f0-9]+\.png/)
      end

      it "has styled reset password button" do
        html_body = get_html_body(mail)

        expect(html_body).to include("Reset password")
        expect(html_body).to match(/border-radius.*20px/i)
      end

      it "has proper header styling" do
        html_body = get_html_body(mail)

        expect(html_body).to include("Reset Your Miru Password")
        expect(html_body).to match(/font-size.*24px/i)
      end

      it "includes footer" do
        html_body = get_html_body(mail)

        expect(html_body).to include("All rights reserved")
      end
    end

    describe "Devise Email Changed Email" do
      let(:mail) do
        Devise::Mailer.email_changed(user, {})
      end

      it "contains inline styles" do
        html_body = get_html_body(mail)

        # Check that premailer has inlined styles
        expect(html_body).to include("style=")
      end

      it "has purple branding color" do
        html_body = get_html_body(mail)

        # Check for the primary brand color
        expect(html_body).to include("#5B34EA")
      end

      it "has styled banner" do
        html_body = get_html_body(mail)

        # Check for banner styling
        expect(html_body).to match(/background.*#5B34EA/i)
        expect(html_body).to match(/Banner-[a-f0-9]+\.png/)
      end

      it "has proper header styling" do
        html_body = get_html_body(mail)

        expect(html_body).to include("Email Address Changed")
        expect(html_body).to match(/font-size.*24px/i)
      end

      it "includes security notice" do
        html_body = get_html_body(mail)

        expect(html_body).to include("hello@saeloun.com")
      end

      it "includes footer" do
        html_body = get_html_body(mail)

        expect(html_body).to include("All rights reserved")
      end
    end

    describe "Devise Password Changed Email" do
      let(:mail) do
        Devise::Mailer.password_change(user, {})
      end

      it "contains inline styles" do
        html_body = get_html_body(mail)

        # Check that premailer has inlined styles
        expect(html_body).to include("style=")
      end

      it "has purple branding color" do
        html_body = get_html_body(mail)

        # Check for the primary brand color
        expect(html_body).to include("#5B34EA")
      end

      it "has styled banner" do
        html_body = get_html_body(mail)

        # Check for banner styling
        expect(html_body).to match(/background.*#5B34EA/i)
        expect(html_body).to match(/Password_Banner-[a-f0-9]+\.png/)
      end

      it "has proper header styling" do
        html_body = get_html_body(mail)

        expect(html_body).to include("Password Changed Successfully")
        expect(html_body).to match(/font-size.*24px/i)
      end

      it "includes security notice" do
        html_body = get_html_body(mail)

        expect(html_body).to include("hello@saeloun.com")
      end

      it "includes footer" do
        html_body = get_html_body(mail)

        expect(html_body).to include("All rights reserved")
      end
    end
  end

  describe "Email compatibility" do
    let(:company) { create :company }
    let(:invitation) { create :invitation, company: }
    let(:mail) do
      UserInvitationMailer.with(
        recipient: invitation.recipient_email,
        token: invitation.token,
        user_already_exists: false,
        name: invitation.full_name
      ).send_user_invitation
    end

    it "does not use external stylesheets" do
      html_body = get_html_body(mail)

      # Ensure no external stylesheet links
      expect(html_body).not_to match(/<link[^>]*rel=["']stylesheet["'][^>]*>/i)
    end

    it "uses table-based layout for footer" do
      html_body = get_html_body(mail)

      # Check that footer uses tables (email-compatible)
      expect(html_body).to match(/<table[^>]*>.*All rights reserved.*<\/table>/im)
    end

    it "has proper DOCTYPE" do
      html_body = get_html_body(mail)

      expect(html_body).to match(/<!DOCTYPE html>/i)
    end

    it "has proper meta tags" do
      html_body = get_html_body(mail)

      expect(html_body).to include("charset=")
    end
  end

  describe "Shared email styles partial" do
    let(:company) { create :company }
    let(:user) { create :user, current_workspace_id: company.id }

    shared_examples "uses shared email styles" do
      it "includes shared base styles" do
        html_body = get_html_body(mail)

        # Check for common styles that should be in the shared partial
        expect(html_body).to match(/font-family.*system-ui/i)
        expect(html_body).to match(/\.banner.*background.*#5B34EA/i)
        expect(html_body).to match(/\.container.*max-width.*640px/i)
        expect(html_body).to match(/\.header.*font-size.*24px/i)
      end
    end

    describe "password change email" do
      let(:mail) do
        Devise::Mailer.password_change(user, {})
      end

      include_examples "uses shared email styles"
    end

    describe "email changed email" do
      let(:mail) do
        Devise::Mailer.email_changed(user, {})
      end

      include_examples "uses shared email styles"
    end

    describe "confirmation instructions email" do
      let(:mail) do
        user.send_confirmation_instructions
        ActionMailer::Base.deliveries.last
      end

      before do
        ActionMailer::Base.deliveries.clear
      end

      include_examples "uses shared email styles"
    end

    describe "weekly reminder email" do
      let(:start_date) { 1.week.ago.beginning_of_week }
      let(:end_date) { 1.week.ago.end_of_week }
      let(:mail) do
        SendWeeklyReminderToUserMailer.with(
          recipients: user.email,
          company_name: company.name,
          name: user.full_name,
          start_date:,
          end_date:
        ).notify_user_about_missed_entries
      end

      include_examples "uses shared email styles"
    end

    describe "password reset instructions email" do
      let(:mail) do
        user.send_reset_password_instructions
        ActionMailer::Base.deliveries.last
      end

      before do
        ActionMailer::Base.deliveries.clear
      end

      include_examples "uses shared email styles"
    end
  end
end
