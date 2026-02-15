# frozen_string_literal: true

module Projects
  class IndexService < ApplicationService
    attr_reader :current_company, :current_user, :search_term

    def initialize(current_company, current_user, search_term)
      @current_company = current_company
      @current_user = current_user
      @search_term = search_term
    end

    def process
      {
        projects: fetch_projects,
        clients: client_list
      }
    end

    private

      def fetch_projects
        projects = Project.kept
          .joins(:client)
          .where(clients: { company_id: current_company.id, id: client_ids })

        projects = projects.where(id: project_ids) unless user_can_see_all_projects?

        if search_term.present?
          query = "%#{search_query}%"
          projects = projects.where(
            "projects.name ILIKE :query OR projects.description ILIKE :query OR clients.name ILIKE :query",
            query:
          )
        end

        projects.includes(:client, :timesheet_entries, project_members: :user).distinct.order(created_at: :desc)
      end

      def search_query
        @_search_query ||= search_term.to_s.strip
      end

      def client_list
        @_client_list ||= if user_can_see_all_projects?
          current_company.clients.kept
        else
          current_company.clients.kept
            .joins(projects: :project_members)
            .where(project_members: { user_id: current_user.id, discarded_at: nil })
            .distinct
        end
      end

      def client_ids
        client_list.distinct.pluck(:id)
      end

      def project_ids
        Project
          .joins(:project_members, :client)
          .where(project_members: { user_id: current_user.id, discarded_at: nil })
          .where(clients: { company_id: current_company.id })
          .distinct
          .pluck(:id)
      end

      def user_can_see_all_projects?
        current_user.has_role?(:owner, current_company) ||
          current_user.has_role?(:admin, current_company) ||
          current_user.has_role?(:book_keeper, current_company)
      end
  end
end
