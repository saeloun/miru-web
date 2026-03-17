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
        base_clients = user_can_see_all_clients? ? current_company.clients.kept : user_assigned_clients

        if query.present?
          search_clients(search_term, where_clause).includes(:logo_attachment, :invoices)
        else
          base_clients.includes(:logo_attachment, :invoices)
        end
      end

      def user_assigned_clients
        Client.kept
          .joins(projects: :project_members)
          .where(company_id: current_company.id)
          .where(project_members: { user_id: current_user.id, discarded_at: nil })
          .distinct
      end

      def search_term
        @_search_term = query.presence || "*"
      end

      def where_clause
        if user_can_see_all_clients?
          { company_id: current_company.id, discarded_at: nil }
        else
          { id: user_assigned_clients.pluck(:id) }
        end
      end

      def user_can_see_all_clients?
        current_user.has_role?(:owner, current_company) ||
          current_user.has_role?(:admin, current_company) ||
          current_user.has_role?(:book_keeper, current_company)
      end

      def search_clients(term, where_query)
        Client.search(
          term,
          fields: [:name, :email],
          match: :word_middle,
          where: where_query
        )
      end

      def client_details
        @_client_details ||= clients_list.where(discarded_at: nil).map { |client|
                                client.client_detail(time_frame)
                              }
      end

      def total_minutes
        client_details.sum { |client| client[:minutes_spent] }
      end

      def overdue_outstanding_amount
        outstanding = 0.0
        overdue = 0.0

        clients_list.each do |client|
          summary = client.client_overdue_and_outstanding_calculation
          outstanding += summary[:outstanding_amount].to_f
          overdue += summary[:overdue_amount].to_f
        end

        {
          outstanding: outstanding.round(2),
          overdue: overdue.round(2),
          currency: current_company.base_currency
        }
      end
  end
end
