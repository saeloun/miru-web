# frozen_string_literal: true

class InternalApi::V1::GenerateInvoiceController < InternalApi::V1::ApplicationController
  def index
    authorize client, policy_class: GenerateInvoicePolicy
    render :index, locals: {
      filter_options:,
      new_line_item_entries:,
      total_new_line_items: new_line_item_entries.total_count
    }, status: :ok
  end

  private

    def client
      @_client ||= Client.find_by(id: params[:client_id])
    end

    def project
      @_project ||= client.projects.kept.pluck(:id).uniq
    end

    # Sending team members list for filter dropdown options
    def filter_options
      user_ids = TimesheetEntry.where(project_id: project).pluck(:user_id).uniq
      @_filter_options ||= {
        team_members: User.where(id: user_ids)
      }
    end

    def search_term
      @_search_term ||= (params[:search_term].present?) ? params[:search_term] : "*"
    end

    # merging selected_entries from params with ids already present in other invoice line items
    def filtered_ids
      invoice_line_item_timesheet_entry_ids = InvoiceLineItem.joins(:timesheet_entry)
        .where(timesheet_entries: { bill_status: "unbilled" })
        .pluck(:timesheet_entry_id).uniq
      selected_entries = (params[:selected_entries].present?) ? params[:selected_entries] : []
      filtered_ids = (selected_entries + invoice_line_item_timesheet_entry_ids).uniq
    end

    def unselected_time_entries_filter
      { id: { not: filtered_ids } }
    end

    def project_filter
      { project_id: project }
    end

    def unbilled_status_filter
      { bill_status: "unbilled" }
    end

    def new_line_item_entries
      default_filter = project_filter.merge(unselected_time_entries_filter)
      bill_status_filter = default_filter.merge(unbilled_status_filter)
      where_clause = bill_status_filter.merge(TimeEntries::Filters.process(params))
      @_new_line_item_entries ||= TimesheetEntry.search(
        search_term,
        fields: [:note, :user_name],
        match: :text_middle,
        where: where_clause,
        includes: [:user, { project: :client } ])
    end
end
