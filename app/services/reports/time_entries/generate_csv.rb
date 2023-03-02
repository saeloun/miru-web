# frozen_string_literal: true

require "csv"

module Reports::TimeEntries
  class GenerateCsv
    attr_reader :entries, :current_company

    def initialize(entries, current_company)
      @entries = entries
      @current_company = current_company
    end

    def process
      CSV.generate(headers: true) do |csv|
        csv << ["Project", "Client", "Note", "Team Member", "Date", "Hours Logged"]
        entries.each do |entry|
          csv << [
            "#{entry.project_name}",
            "#{entry.client_name}",
            "#{entry.note}",
            "#{entry.user_name}",
            "#{format_date(entry.work_date)}",
            "#{DurationFormatter.new(entry.duration).process}"
          ]
        end
      end
    end

    private

      def format_date(date)
        CompanyDateFormattingService.new(date, company: current_company, is_es_date: true).process
      end
  end
end
