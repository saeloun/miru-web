# frozen_string_literal: true

module Invitations
  class CreateInvitationService
    attr_reader :params, :current_company, :current_user
    attr_accessor :invitation

    def initialize(params, current_company, current_user)
      @params = params
      @current_company = current_company
      @current_user = current_user
      @invitation = Invitation.new(params)
    end

    def process
      set_company
      set_sender
      invitation.save!
      invitation
    end

    private

      def set_company
        @invitation.company = current_company
      end

      def set_sender
        @invitation.sender = current_user
      end
  end
end
