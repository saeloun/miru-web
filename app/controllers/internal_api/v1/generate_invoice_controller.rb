# frozen_string_literal: true

class InternalApi::V1::GenerateInvoiceController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: GenerateInvoicePolicy
    render :index, locals: {
      filter_options:,
      new_line_item_entries:,
      new_line_item_entry_total_count: new_line_item_entries.size()
    }, status: :ok
  end

  private

    def client
      @_client ||= Client.find(params[:client_id])
    end

    def project
      @_project ||= Project.includes(:timesheet_entries).find_by(client_id: params[:client_id])
    end

    # Sending team members list for filter dropdown options
    def filter_options
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
      { project_id: project.id }
    end

    def new_line_item_entries
      default_filter = project_filter.merge(unselected_time_entries_filter)
      where_clause = default_filter.merge(TimeEntries::Filters.process(params))
      search_result = TimesheetEntry.search(
        search_term,
        fields: [:note, :user_name],
        match: :text_middle,
        where: where_clause)
    end
end
