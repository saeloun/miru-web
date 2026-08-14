# frozen_string_literal: true

require "csv"

class Reports::GenerateCsv
  attr_reader :data, :headers

  def initialize(data, headers)
    @data = data
    @headers = headers
  end

  def process
    CSV.generate do |csv|
      csv << sanitize_row(headers)
      data.each do |row|
        csv << sanitize_row(row)
      end
    end
  end

  private

    def sanitize_row(row)
      row.map do |cell|
        cell.is_a?(String) && cell.match?(/\A[=+\-@\t\r\n]/) ? "'#{cell}" : cell
      end
    end
end
