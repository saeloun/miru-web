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
      invitations = create_invitations_for_email
      invitations
    end

    private

      def create_invitations_for_email
        invitation = Invitation.new(
          first_name: params.dig(:firstName),
          last_name: params.dig(:lastName),
          recipient_email: params.dig(:email),
          role: "client"
        )
        set_company(invitation)
        set_sender(invitation)
        set_client(invitation)
        invitation.save!
        invitation
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
