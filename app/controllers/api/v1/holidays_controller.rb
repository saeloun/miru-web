# frozen_string_literal: true

class Api::V1::HolidaysController < Api::V1::ApplicationController
  def index
    authorize Holiday

    holidays = current_company.holidays.kept.includes([:holiday_infos])
    render :index, locals: { holidays: }, status: 200
  end

  def update
    authorize Holiday

    year = params[:year]
    service = BulkHolidayService.new(year, holiday_params, current_company)
    if service.process
      render json: { notice: I18n.t("holidays.update.success") }, status: 200
    else
      render json: { field_errors: service.errors }, status: :unprocessable_entity
    end
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
