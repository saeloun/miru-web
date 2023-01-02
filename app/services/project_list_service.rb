# frozen_string_literal: true

class ProjectListService
  attr_accessor :current_company, :client_id, :user_id, :billable, :search

  def initialize(current_company, client_id, user_id, billable, search)
    @current_company = current_company
    @client_id = client_id
    @user_id = user_id
    @billable = billable
    @search = search
  end

  def process
    project_list = project_list_query(client_id, user_id, billable)
    minutes_spent = current_company.timesheet_entries.group(:project_id).sum(:duration)
    query = project_list.ransack({ name_or_client_name_cont: search })
    project_list = query.result
    project_ids = project_list.ids.uniq

    current_company.projects.left_outer_joins([:project_members, :timesheet_entries]).joins([:client]).select(
      "
    projects.id,
    projects.name,
    projects.billable,
    clients.name as _client_name,
    SUM(timesheet_entries.duration) as minutes_spent"
  ).group("projects.id, clients.name").where(projects: { id: project_ids }).order("projects.name DESC")
  end

  private

    def project_list_query(client_id, user_id, billable)
      db_query = current_company.projects.kept.left_outer_joins(:project_members).joins(:client)
      db_query = db_query.where(project_members: { user_id: }) if user_id.present?
      db_query = db_query.where(client_id:) if client_id.present?
      db_query = db_query.where(projects: { billable: }) if billable.present?
      db_query.select(
        "projects.id as id,
        projects.name as project_name,
        projects.billable as is_billable,
        clients.name as project_client_name"
      )
    end
end
