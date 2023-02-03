# frozen_string_literal: true

class DateFormatService
  attr_reader :date, :current_company

  def initialize(date, current_company)
    @date = date
    @current_company = current_company
  end

  def process
    date.strftime(date_format)
  end

  private

    def date_format
      case current_company.date_format
      when "DD-MM-YYYY"
        "%d.%m.%Y"
      when "YYYY-MM-DD"
        "%Y.%m.%d"
      else
        "%m.%d.%Y"
      end
    end
end
