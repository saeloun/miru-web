# frozen_string_literal: true

class InternalApi::V1::GenerateInvoiceController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: GenerateInvoicePolicy
    render :index, locals: { current_company: }, status: :ok
  end

  def show
    authorize :show, policy_class: GenerateInvoicePolicy
    render :show, locals: { new_line_item_entries:, filter_options: }, status: :ok
  end

  private

    def client
      @_client ||= Client.find(params[:id])
    end

    def filter_options
      project = Project.find_by(client_id: params[:id])
      user_ids = project.timesheet_entries.pluck(:user_id).uniq
      @_filter_options ||= {
        team_members: User.find(user_ids)
      }
    end

    def search_term
      @search_term ||= (params[:search_term].present?) ? params[:search_term] : "*"
    end

    def unselected_time_entries_filter
      { id: { not: params[:selected_entries] } }
    end

    def project_filter
      { project_id: Project.find_by(client_id: params[:id]).id }
    end

    def new_line_item_entries
      default_filter = project_filter.merge(unselected_time_entries_filter)
      where_clause = default_filter.merge(TimeEntries::Filters.process(params))
      search_result = TimesheetEntry.search(
        search_term,
        fields: [:note, :user_name],
        match: :text_middle,
        where: where_clause,
        page: params[:page],
        per_page: 10)
    end
end
