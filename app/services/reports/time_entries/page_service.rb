# frozen_string_literal: true

class Reports::TimeEntries::PageService < ApplicationService
  include Pagy::Backend

  attr_reader :params, :page, :group_by, :current_company, :pagy_data, :es_filter

  PER_PAGE = {
    users: 5,
    clients: 3,
    projects: 3
  }

  def initialize(params, current_company)
    @params = params
    @page = params["page"]
    @group_by = params[:group_by]
    @current_company = current_company
    @pagy_data = nil

    @es_filter = nil
  end

  def process
    es_filter_for_pagination
  end

  def pagination_details
    {
      pages: pagy_data.pages,
      first: pagy_data.page == 1,
      prev: pagy_data.prev,
      next: pagy_data.next,
      last: pagy_data.last
    }
  end

  private

    def es_filter_for_pagination
      if Reports::TimeEntries::GroupBy.new(group_by).valid_group_by?
        send("#{group_by}_filter")
      else
        @es_filter = {}
      end
    end

    def team_member_filter
      @pagy_data, users = pagy(users_query, items: PER_PAGE[:users], page:)
      @es_filter = { user_id: users.pluck(:id) }
    end

    def client_filter
      @pagy_data, clients = pagy(clients_query, items: PER_PAGE[:clients], page:)
      @es_filter = { client_id: clients.pluck(:id) }
    end

    def project_filter
      @pagy_data, projects = pagy(projects_query, items: PER_PAGE[:projects], page:)
      @es_filter = { project_id: projects.pluck(:id) }
    end

    def users_query
      current_company.users
        .with_ids(params[:team_member])
        .order(:first_name)
        .select(:id)
    end

    def clients_query
      current_company.clients
        .with_ids(params[:client])
        .order(:name)
        .select(:id)
    end

    def projects_query
      current_company.projects
        .with_ids(params[:project])
        .order(:name)
        .select(:id)
    end
end
