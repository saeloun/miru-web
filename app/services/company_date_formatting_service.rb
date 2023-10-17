# frozen_string_literal: true

class CompanyDateFormattingService < ApplicationService
  attr_reader :date, :company, :es_date_presence

  def initialize(date, company: nil, es_date_presence: false)
    @date = date
    @company = company
    @es_date_presence = es_date_presence
  end

  def process
    return if !company

    @date = date.to_date if es_date_presence
    date&.strftime(company_date_format)
  end

  private

    def company_date_format
      case company.date_format
      when "DD-MM-YYYY"
        "%d.%m.%Y"
      when "YYYY-MM-DD"
        "%Y.%m.%d"
      when "MM-DD-YYYY"
        "%m.%d.%Y"
      end
    end
end
