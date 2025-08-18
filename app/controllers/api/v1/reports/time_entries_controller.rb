# frozen_string_literal: true

module Api::V1
  module Reports
    class TimeEntriesController < Api::V1::ApplicationController
      before_action :authenticate_user!
      after_action :verify_authorized

      def index
        authorize :report, :index?

        entries = current_company.timesheet_entries
                                 .includes(:user, :project, :client)
                                 .order(work_date: :desc)

        entries = filter_entries(entries)

        render json: {
          entries: entries.map { |entry| serialize_entry(entry) },
          summary: calculate_summary(entries)
        }
      end

      def download
        authorize :report, :index?

        # Generate CSV or PDF download
        respond_to do |format|
          format.csv { send_data generate_csv, filename: "time_entries_#{Date.current}.csv" }
          format.pdf { send_data generate_pdf, filename: "time_entries_#{Date.current}.pdf" }
        end
      end

      private

        def filter_entries(entries)
          entries = entries.where(work_date: params[:from]..params[:to]) if params[:from] && params[:to]
          entries = entries.where(user_id: params[:user_id]) if params[:user_id]
          entries = entries.where(project_id: params[:project_id]) if params[:project_id]
          entries = entries.where(client_id: params[:client_id]) if params[:client_id]
          entries
        end

        def serialize_entry(entry)
          {
            id: entry.id,
            date: entry.work_date,
            user: entry.user&.full_name,
            project: entry.project&.name,
            client: entry.client&.name,
            hours: entry.duration,
            description: entry.note,
            billable: entry.bill_status == "billable"
          }
        end

        def calculate_summary(entries)
          {
            total_hours: entries.sum(:duration),
            billable_hours: entries.where(bill_status: "billable").sum(:duration),
            non_billable_hours: entries.where(bill_status: "non_billable").sum(:duration),
            total_entries: entries.count
          }
        end

        def generate_csv
          # CSV generation logic
          "Date,User,Project,Client,Hours,Description,Billable\n"
        end

        def generate_pdf
          # PDF generation logic
          "PDF content"
        end

        def current_company
          @_current_company ||= current_user.current_workspace
        end
    end
  end
end
