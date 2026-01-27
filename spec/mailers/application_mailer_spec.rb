# frozen_string_literal: true

require "rails_helper"

RSpec.describe ApplicationMailer, type: :mailer do
  describe "Postmark error handling" do
    describe "email extraction regex" do
      it "extracts single email address" do
        message = "Found inactive addresses: test@example.com."
        emails = message.scan(/[\w+\-.]+@[a-z\d-]+(?:\.[a-z\d-]+)*\.[a-z]+/i)

        expect(emails).to eq(["test@example.com"])
      end

      it "extracts multiple email addresses" do
        message = "Found inactive addresses: user1@example.com, user2@example.com."
        emails = message.scan(/[\w+\-.]+@[a-z\d-]+(?:\.[a-z\d-]+)*\.[a-z]+/i)

        expect(emails).to contain_exactly("user1@example.com", "user2@example.com")
      end

      it "handles emails with subdomains" do
        message = "Found inactive addresses: user@mail.example.com."
        emails = message.scan(/[\w+\-.]+@[a-z\d-]+(?:\.[a-z\d-]+)*\.[a-z]+/i)

        expect(emails).to eq(["user@mail.example.com"])
      end

      it "handles emails with hyphens and underscores" do
        message = "Found inactive addresses: first.last@my-domain.com."
        emails = message.scan(/[\w+\-.]+@[a-z\d-]+(?:\.[a-z\d-]+)*\.[a-z]+/i)

        expect(emails).to eq(["first.last@my-domain.com"])
      end
    end

    describe "rescue_from configuration" do
      it "has rescue_from handler for Postmark::InactiveRecipientError" do
        expect(ApplicationMailer).to respond_to(:rescue_handlers)

        # Verify the exception mapping is configured
        exception_classes = ApplicationMailer.rescue_handlers.map(&:first)
        expect(exception_classes).to include("Postmark::InactiveRecipientError")

        # Verify the handler method exists
        mailer = ApplicationMailer.new
        expect(mailer.private_methods).to include(:handle_inactive_recipient)
      end
    end
  end
end
