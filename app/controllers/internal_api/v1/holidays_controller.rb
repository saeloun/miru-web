# frozen_string_literal: true

class InternalApi::V1::HolidaysController < ApplicationController
  def index
    authorize Holiday

    year = params[:year]
    holiday = current_company.holidays.find_by(year:)
    if holiday.nil?
      render json: { error: "No holiday record found for the specified year and company" }, status: :not_found
    else
      holiday_infos = holiday.holiday_infos
      render :index, locals: { holiday_infos: }, status: :ok
    end
  end

  def update
    authorize Holiday

    year = params[:year]
    BulkHolidayService.new(year, holiday_params, current_company).process
    render json: { notice: "Holiday Info updated successfully" }, status: :ok
  end

  private

    def holiday_params
      params.require(:holiday).permit(
        holiday: [:enable_optional_holidays, :no_of_allowed_optional_holidays, :time_period_optional_holidays,
                  holiday_types: []],
        add_holiday_infos: [:name, :date, :category],
        update_holiday_infos: [:id, :name, :date, :category],
        remove_holiday_infos: []
      )
    end
end
