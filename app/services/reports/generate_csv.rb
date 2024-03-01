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
    csv << headers

    data.each do |row|
    csv << row
  end
  end
end
end
