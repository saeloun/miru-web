# frozen_string_literal: true

class DateFormatter
  attr_reader :date, :company

  def initialize(date, company: nil)
    @date = date
    @company = company
  end

  def company_format
    return if !company

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
