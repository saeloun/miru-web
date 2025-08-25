# frozen_string_literal: true

class InternalApi::V1::HolidaysController < ApplicationController
  def index
    authorize Holiday

    holidays = current_company.holidays.kept.includes([:holiday_infos])
    render :index, locals: { holidays: }, status: 200
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
