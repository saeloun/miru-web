# frozen_string_literal: true

module Clients
  class IndexService < ApplicationService
    attr_reader :current_company, :current_user, :query, :time_frame

    def initialize(current_company, current_user, query, time_frame)
      @current_company = current_company
      @current_user = current_user
      @query = query
      @time_frame = time_frame
    end

    def process
      {
        client_details:,
        total_minutes:,
        overdue_outstanding_amount:
      }
    end

    private

      def clients_list
        base_clients = user_can_see_all_clients? ? current_company.clients : user_assigned_clients

        if query.present?
          search_clients(search_term, where_clause).includes(:logo_attachment)
        else
          base_clients.includes(:logo_attachment)
        end
      end

      def user_assigned_clients
        # Get clients only from projects where user has active (not soft-deleted) memberships
        # Scoped to current company to prevent cross-tenant data leakage
        Client.joins(projects: :project_members)
          .where(company_id: current_company.id)
          .where(project_members: { user_id: current_user.id, discarded_at: nil })
          .distinct
      end

      def search_term
        @_search_term = query.presence || "*"
      end

      def where_clause
        if user_can_see_all_clients?
          { company_id: current_company.id }
        else
          { id: user_assigned_clients.pluck(:id) }
        end
      end

      def user_can_see_all_clients?
        current_user.has_role?(:owner, current_company) ||
          current_user.has_role?(:admin, current_company) ||
          current_user.has_role?(:bookkeeper, current_company)
      end

      def search_clients(search_term, where_clause)
        Client.search(
          search_term,
          fields: [:name, :email],
          match: :word_middle,
          where: where_clause
        )
      end

      def client_details
        @_client_details ||= clients_list.where(discarded_at: nil).map { |client|
                                client.client_detail(time_frame)
                              }
      end

      def total_minutes
        (client_details.map { |client| client[:minutes_spent] }).sum
      end

      def overdue_outstanding_amount
        current_company.overdue_and_outstanding_and_draft_amount
      end
  end
end
