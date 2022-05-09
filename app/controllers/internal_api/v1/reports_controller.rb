# frozen_string_literal: true

class InternalApi::V1::ReportsController < InternalApi::V1::ApplicationController
  include Timesheet

  def index
    authorize :report
    respond_to do |f|
       f.html
       f.json { render json: { entries: }, status: :ok }
       f.csv do |csv|
         send_reports_csv(entries)
       end
     end
  end

  private

    def entries
      current_company.timesheet_entries.includes([:user, :project]).map do |timesheet_entry|
        timesheet_entry.formatted_entry.transform_keys { |key| key.to_s.camelize(:lower) }
      end
    end

    def send_reports_csv(entries)
      headers = %w[project/headers note team_member/date hours_logged].map(&:titleize)
      csv_data = CSV.generate(headers: true) do |csv|
        csv << headers

        entries.each do |entry|
          csv_row = []

          csv_row << entry

          csv << csv_row
        end
      end
      send_data(csv_data, filename: "reports.csv")
    end
end
