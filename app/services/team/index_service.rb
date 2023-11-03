# frozen_string_literal: true

module Team
  class IndexService < ApplicationService
    attr_reader :current_company, :query, :team_data

    def initialize(current_company, query, team_data)
      @current_company = current_company
      @query = query
      @team_data = team_data
    end

    def process
      {
        team_list:
      }
    end

    private

      def team_list
        if query.present?
          search_teams(search_term)
        end
      end

      def search_term
        @_search_term = query.presence || "*"
      end

      def search_teams(search_term)
        users = current_company.users
        User.search(
          search_term,
          fields: [:first_name, :last_name, :email],
          match: :word_middle,
          where: { id: users.pluck(:id) }
        )
      end
  end
end
