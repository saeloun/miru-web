# frozen_string_literal: true

class Reports::TimeEntries::FilterService < ApplicationService
  include Pagy::Backend

  attr_reader :params, :page, :group_by, :current_company, :pagy_data, :es_filter, :reports

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

  private

    def es_filter_for_pagination
      if Reports::TimeEntries::GroupBy.new(group_by).valid_group_by?
        send("#{group_by}_filter")
      else
        params[:date_range] == "custom" ? set_default_pagination_data : @es_filter = {}
      end
    end

    def set_default_pagination_data
      @es_filter = { id: current_company.timesheet_entries.kept.pluck(:id) }
    end

    def team_member_filter
      @es_filter = { user_id: users_query.pluck(:id) }
    end

    def client_filter
      @es_filter = { client_id: clients_query.pluck(:id) }
    end

    def project_filter
      @es_filter = { project_id: projects_query.pluck(:id) }
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
