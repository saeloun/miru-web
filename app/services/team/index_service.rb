# frozen_string_literal: true

module Team
  class IndexService < ApplicationService
    attr_accessor :current_company, :current_user, :query

    def initialize(current_company:, current_user:, query:)
      @current_company = current_company
      @current_user = current_user
      @query = query
    end

    def process
      { combined_data: }
    end

    private

      def search_term
        @_search_term = query.presence || "*"
      end

      def teams
        user_ids = current_company.employees_without_client_role.pluck(:id)

        User.search(
          search_term,
          fields: [:first_name, :last_name, :email],
          match: :word_middle,
          where: { id: user_ids },
          includes: [:avatar_attachment]
        )
      end

      def invitations
        invitation_ids = current_company.invitations.valid_invitations.where.not(role: "client").pluck(:id)

        Invitation.search(
          search_term,
          fields: [:first_name, :last_name, :recipient_email],
          match: :word_middle,
          where: { sender_id: current_user.id, id: invitation_ids }
        )
      end

      def prepare_team_and_invitation_data
        presenter_data = TeamPresenter.new(teams, invitations, current_user, current_company).index_data
        team_data = presenter_data[:teams]
        invitation_data = presenter_data[:invitations]

        [team_data, invitation_data]
      end

      def combined_data
        team_data, invitation_data = prepare_team_and_invitation_data

        team_data + invitation_data
      end
  end
end
