# frozen_string_literal: true

class CompanyDateFormattingService < ApplicationService
  attr_reader :date, :company, :is_es_date

  def initialize(date, company: nil, is_es_date: false)
    @date = date
    @company = company
    @is_es_date = is_es_date
  end

  def process
    return if !company

    @date = date.to_date if is_es_date
    date.strftime(company_date_format)
  end

  private

    def company_date_format
      case company.date_format
      when "DD-MM-YYYY"
        "%d.%m.%Y"
      when "YYYY-MM-DD"
        "%Y.%m.%d"
      else
        "%m.%d.%Y"
      end
    end
end
