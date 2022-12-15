# frozen_string_literal: true

class ProjectsIndexService
  attr_reader :current_company, :params
  attr_accessor :clients, :projects, :users

  def initialize(current_company, params)
    @current_company = current_company
    @params = params
    set_projects
    set_clients
    set_users
  end

  def process
    {
      projects:,
      clients:,
      users:
    }
  end

  private

    def set_projects
      @projects = current_company.project_list(
        params[:client_id], params[:user_id], params[:billable],
        params[:search])
    end

    def set_clients
      @clients = current_company.clients.kept
    end

    def set_users
      @users = current_company.employments.joins(:user)
        .select("users.id as id, users.first_name as first_name, users.last_name as last_name")
    end
end
