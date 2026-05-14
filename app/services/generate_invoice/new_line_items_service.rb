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
        direct_entry_ids = InvoiceLineItem.joins(:timesheet_entry)
          .where(invoice_id: discarded_invoice_ids)
          .where(timesheet_entries: { bill_status: "unbilled", discarded_at: nil })
          .pluck(:timesheet_entry_id)
        linked_entry_ids = InvoiceLineItemTimeEntry
          .joins(:timesheet_entry, :invoice_line_item)
          .where(invoice_line_items: { invoice_id: discarded_invoice_ids })
          .where(timesheet_entries: { bill_status: "unbilled", discarded_at: nil })
          .pluck(:timesheet_entry_id)

        @filtered_ids ||= params[:selected_entries].to_a | direct_entry_ids | linked_entry_ids
      end

      def where_clause
        {
          project_id: @projects.pluck(:id),
          id: { not: filtered_ids },
          bill_status: "unbilled",
          discarded_at: nil
        }.merge(TimeEntries::Filters.process(params))
      end

      def search_term
        @_search_term = params[:search_term].presence || "*"
      end

      def new_line_item_entries
        timesheet_entries = search_timesheet_entries(search_term, where_clause)

        @total_count = timesheet_entries.count
        format_timesheet_entries(timesheet_entries)
      end

      def search_timesheet_entries(search_term, where_clause)
        # Use the custom search method from Searchable concern
        entries = TimesheetEntry.includes(:user, project: :client)

        # Apply where conditions
        where_clause.each do |key, value|
          entries = if value.is_a?(Hash) && value.key?(:not)
            entries.where.not(key => value[:not])
          else
            entries.where(key => value)
          end
        end

        # Apply search if not wildcard
        if search_term.present? && search_term != "*"
          entries = entries.pg_search(search_term) if entries.respond_to?(:pg_search)
        end

        entries
      end

      def format_timesheet_entries(timesheet_entries)
        user_project_rates = ProjectMembersPresenter.new(projects).project_to_member_hourly_rate

        return format_project_aggregates(timesheet_entries, user_project_rates) if group_by_project?

        timesheet_entries.map do |timesheet_entry|
          rate = user_project_rates[timesheet_entry.project_id][timesheet_entry.user_id]

          {
            selection_id: "timesheet-entry-#{timesheet_entry.id}",
            timesheet_entry_id: timesheet_entry.id,
            linked_timesheet_entry_ids: [],
            user_id: timesheet_entry.user_id,
            project_id: timesheet_entry.project_id,
            project_name: timesheet_entry.project.name,
            first_name: timesheet_entry.user.first_name,
            last_name: timesheet_entry.user.last_name,
            description: timesheet_entry.note,
            date: timesheet_entry.work_date,
            quantity: timesheet_entry.duration,
            rate:
          }
        end
      end

      def group_by_project?
        ActiveModel::Type::Boolean.new.cast(params[:group_by_project])
      end

      def format_project_aggregates(timesheet_entries, user_project_rates)
        timesheet_entries
          .group_by { |entry| [entry.project_id, entry.user_id, user_project_rates[entry.project_id][entry.user_id]] }
          .map do |(project_id, user_id, rate), entries|
            first_entry = entries.first
            work_dates = entries.map(&:work_date)

            {
              selection_id: "project-aggregate-#{project_id}-#{user_id}-#{formatted_rate(rate)}",
              timesheet_entry_id: nil,
              linked_timesheet_entry_ids: entries.map(&:id),
              user_id:,
              project_id:,
              project_name: first_entry.project.name,
              first_name: nil,
              last_name: nil,
              name: first_entry.project.name,
              description: "#{first_entry.user.full_name} - #{entries.size} entries",
              date: work_dates.min,
              date_range: [work_dates.min, work_dates.max].uniq.join(" - "),
              quantity: entries.sum(&:duration),
              rate:,
              entry_count: entries.size
            }
          end
      end

      def formatted_rate(rate)
        return rate.to_s("F") if rate.is_a?(BigDecimal)

        rate.to_s
      end
  end
end
