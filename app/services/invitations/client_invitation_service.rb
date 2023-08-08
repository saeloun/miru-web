# frozen_string_literal: true

module Invitations
  class ClientInvitationService
    attr_reader :params, :current_company, :current_user, :client
    attr_accessor :invitation

    def initialize(params, current_company, current_user, client)
      @params = params
      @current_company = current_company
      @current_user = current_user
      @client = client
    end

    def process
      recipient_emails = extract_recipient_emails
      invitations = create_invitations_for_emails(recipient_emails)
      invitations
    end

    private

      def extract_recipient_emails
        params.dig(:client, :emails).split(",").map(&:strip)
      end

      def create_invitations_for_emails(emails)
        emails.map do |email|
          invitation = Invitation.new(
            first_name: params.dig(:client, :name),
            last_name: params.dig(:client, :name),
            recipient_email: email,
            role: "client"
          )
          set_company(invitation)
          set_sender(invitation)
          set_client(invitation)
          invitation.save!
          invitation
        end
      end

      def set_company(invitation)
        invitation.company = current_company
      end

      def set_sender(invitation)
        invitation.sender = current_user
      end

      def set_client(invitation)
        invitation.client = client
      end
  end
end
