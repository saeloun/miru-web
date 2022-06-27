# frozen_string_literal: true

require "csv"

module Reports::TimeEntries
  class GenerateCsv
    attr_reader :entries

    def initialize(entries)
      @entries = entries
    end

    def process
      CSV.generate(headers: true) do |csv|
        csv << ["Project", "Client", "Note", "Team Member", "Date", "Hours Logged"]
        entries.each do |entry|
          csv << [
            "#{entry.project_name}",
            "#{entry.client_name}",
            "#{entry.note}",
            "#{entry.user_full_name}",
            "#{entry.work_date.strftime('%Y-%m-%d')}",
            "#{entry.formatted_duration}"
          ]
        end
      end
    end
  end
end
