# frozen_string_literal: true

require "rails_helper"

RSpec.describe Devise::Mailer, type: :mailer do
  describe "email_changed" do
    it "includes the support alias in the body" do
      user = create(:user)

      mail = described_class.email_changed(user)

      expect(mail.body.encoded).to include("hello@saeloun.com")
    end
  end

  describe "password_change" do
    it "includes the support alias in the body" do
      user = create(:user)

      mail = described_class.password_change(user)

      expect(mail.body.encoded).to include("hello@saeloun.com")
    end
  end

  describe "unlock_instructions" do
    it "explains the timed lock behavior and points to sign in" do
      user = create(:user)

      mail = described_class.unlock_instructions(user, "preview-unlock-token")

      expect(mail.body.encoded).to include("30 minutes")
      expect(mail.body.encoded).to include("/login")
    end
  end
end
