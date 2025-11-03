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

    def fetch_projects
      where_conditions = { client_id: client_ids, discarded_at: nil }

      # Only add project_ids filter for non-admin users
      unless user_can_see_all_projects?
        where_conditions[:id] = project_ids
      end

      @_fetch_projects ||= Project.search(
        search_query,
        fields: [:client_name, :name],
        match: :text_middle,
        where: where_conditions,
        includes: [:client, :timesheet_entries]
      )
    end

    def search_query
      @_search_query ||= search_term.present? ? search_term : "*"
    end

    def client_list
      @_client_list ||= if user_can_see_all_projects?
        current_company.clients
      else
        current_company.clients
          .joins(projects: :project_members)
          .where(project_members: { user_id: current_user.id, discarded_at: nil })
          .distinct
      end
    end

    def client_ids
      client_list.pluck(:id).uniq
    end

    def project_ids
      # Only get projects where the user has active (not soft-deleted) project memberships
      # Scoped to current company to prevent cross-tenant data leakage
      Project
        .joins(:project_members, :client)
        .where(project_members: { user_id: current_user.id, discarded_at: nil })
        .where(clients: { company_id: current_company.id })
        .distinct.pluck(:id)
    end

    def user_can_see_all_projects?
      current_user.has_role?(:owner, current_company) ||
        current_user.has_role?(:admin, current_company) ||
        current_user.has_role?(:bookkeeper, current_company)
    end
  end
end
