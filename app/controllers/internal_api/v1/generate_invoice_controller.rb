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
      @_filter_options ||= {
        team_members: User.find(Project.find_by(client_id: params[:id]).timesheet_entries.pluck(:user_id).uniq())
      }
    end

    def search_term
      if params[:search_term].present?
        @search_term ||= params[:search_term]
      else
        @search_term ||= "*"
      end
    end

    def unselected_time_entries_filter
      { id: { not: params[:selected_entries] } }
    end

    def project_filter
      { project_id: Project.find_by(client_id: params[:id]).id }
    end

    def new_line_item_entries
      default_filter = project_filter.merge(unselected_time_entries_filter)
      where_clause = default_filter.merge(Reports::TimeEntries::Filters.process(params))
      search_result = TimesheetEntry.search(
        search_term,
        fields: [:note, :user_name],
        match: :text_middle,
        where: where_clause)
    end
end
