# frozen_string_literal: true

class Api::V1::HolidaysController < Api::V1::BaseController
  after_action :verify_authorized, except: [:index]

  def index
    authorize Holiday if current_user

    holidays = current_company.holidays.kept.includes([:holiday_infos])

    render json: {
      holidays: holidays.map do |holiday|
        {
          id: holiday.id,
          year: holiday.year,
          enable_optional_holidays: holiday.enable_optional_holidays,
          no_of_allowed_optional_holidays: holiday.no_of_allowed_optional_holidays,
          time_period_optional_holidays: holiday.time_period_optional_holidays,
          holiday_types: holiday.holiday_types,
          created_at: holiday.created_at,
          updated_at: holiday.updated_at,
          optional_holidays: holiday.holiday_infos.where(category: "optional").map do |info|
            {
              id: info.id,
              name: info.name,
              date: info.date,
              category: info.category
            }
          end,
          national_holidays: holiday.holiday_infos.where(category: "national").map do |info|
            {
              id: info.id,
              name: info.name,
              date: info.date,
              category: info.category
            }
          end
        }
      end
    }
  end

  def update
    authorize Holiday

    year = params[:year]
    BulkHolidayService.new(year, holiday_params, current_company).process
    render json: { notice: "Holiday Info updated successfully" }, status: 200
  end

  private

    def holiday_params
      params.require(:holiday).permit(
        holiday: [:year, :enable_optional_holidays, :no_of_allowed_optional_holidays, :time_period_optional_holidays,
                  holiday_types: []],
        add_holiday_infos: [:name, :date, :category],
        update_holiday_infos: [:id, :name, :date, :category],
        remove_holiday_infos: []
      )
    end
end
