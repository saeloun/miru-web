# frozen_string_literal: true

module GenerateInvoice
  class NewLineItemsService < ApplicationService
    attr_reader :client, :projects, :params
    attr_accessor :total_count

    def initialize(client, params)
      @client = client
      @params = params
      @projects = client.projects.includes(:project_members).kept
    end

    def process
      {
        filter_options: {
          team_members: team_members_of_projects
        },
        new_line_item_entries:,
        total_new_line_items: total_count
      }
    end

    private

      # Sending team members list for filter dropdown options
      def team_members_of_projects
        @team_members_of_projects ||= User.where(
          id: TimesheetEntry.kept.where(project_id: @projects).pluck(:user_id)
        )
      end

      # merging selected_entries from params with ids already present in other invoice line items
      def filtered_ids
        discarded_invoice_ids = Invoice.kept.pluck(:id)
        @filtered_ids ||= params[:selected_entries].to_a | InvoiceLineItem.joins(:timesheet_entry)
          .where(invoice_id: discarded_invoice_ids)
          .where(timesheet_entries: { bill_status: "unbilled", discarded_at: nil })
          .pluck(:timesheet_entry_id)
      end

      def unselected_time_entries_filter
        { id: { not: filtered_ids } }
      end

      def project_filter
        { project_id: @projects.pluck(:id) }
      end

      def unbilled_status_filter
        { bill_status: "unbilled" }
      end

      def where_clause
        project_filter
          .merge(unselected_time_entries_filter)
          .merge(unbilled_status_filter)
          .merge(TimeEntries::Filters.process(params))
      end

      def search_term
        @_search_term = params[:search_term].presence || "*"
      end

      def new_line_item_entries
        timesheet_entries = search_timesheet_entries(search_term, where_clause).where(discarded_at: nil)

        @total_count = timesheet_entries.total_count
        format_timesheet_entries(timesheet_entries)
      end

      def search_timesheet_entries(search_term, where_clause)
        TimesheetEntry.search(
          search_term,
          fields: [:note, :user_name],
          match: :word_middle,
          where: where_clause,
          includes: [:user, { project: :client }]
        )
      end

      def format_timesheet_entries(timesheet_entries)
        user_project_rates = ProjectMembersPresenter.new(projects).project_to_member_hourly_rate

        timesheet_entries.map do |timesheet_entry|
          {
            timesheet_entry_id: timesheet_entry.id,
            user_id: timesheet_entry.user_id,
            project_id: timesheet_entry.project_id,
            first_name: timesheet_entry.user.first_name,
            last_name: timesheet_entry.user.last_name,
            description: timesheet_entry.note,
            date: timesheet_entry.work_date,
            quantity: timesheet_entry.duration,
            rate: user_project_rates[timesheet_entry.project_id][timesheet_entry.user_id]
          }
        end
      end
  end
end
