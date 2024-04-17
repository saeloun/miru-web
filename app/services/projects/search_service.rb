# frozen_string_literal: true

module Projects
  class SearchService < ApplicationService
    def initialize(query, current_company, client_id = nil, user_id = nil, billable = nil)
      @query = query
      @current_company = current_company
      @client_id = client_id
      @user_id = user_id
      @billable = billable
    end

    def process
      minutes_spent = @current_company.timesheet_entries.kept.group(:project_id).sum(:duration)
      project_list = project_list_query.ransack({ name_or_client_name_cont: @query }).result
      project_ids = project_list.ids.uniq

      @current_company.projects.left_outer_joins([:project_members, :timesheet_entries]).joins([:client]).select(
        "projects.id,
        projects.name,
        projects.billable,
        clients.name as _client_name,
        SUM(timesheet_entries.duration) as minutes_spent"
      ).group("projects.id, clients.name").where(projects: { id: project_ids }).order("projects.name DESC")
    end

    def project_list_query
      @_project_list_query ||= @current_company.projects.kept.left_outer_joins(:project_members).joins(:client)
      @_project_list_query ||= @_project_list_query.where(project_members: { user_id: }) if @user_id.present?
      @_project_list_query ||= @_project_list_query.where(client_id:) if @client_id.present?
      @_project_list_query ||= @_project_list_query.where(projects: { billable: }) if @billable.present?

      @_project_list_query.select(
        "projects.id as id,
        projects.name as project_name,
        projects.billable as is_billable,
        clients.name as project_client_name"
      )
    end
  end
end
