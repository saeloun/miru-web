# frozen_string_literal: true

class InternalApi::V1::HolidaysController < ApplicationController
  before_action :set_year, only: [:create]

  def index
    authorize Holiday

    year = params[:year]
    holiday_infos = Holiday.find_by(year:).holiday_infos
    render :index, locals: { holiday_infos: }, status: :ok
  end

  def create
    authorize Holiday

    @holiday = current_company.holidays.find_or_initialize_by(year: @year)
    success = true

    if @holiday.new_record?
      @holiday.holiday_types = holiday_params[:holiday_types]
    end

    holiday_info_params.each do |info_params|
      holiday_info = @holiday.holiday_infos.build(info_params)
      @holiday.enable_optional_holidays = holiday_params[:enable_optional_holidays]
      unless @holiday.save && holiday_info.save
        success = false
        break
      end
    end

    if success
      render json: { notice: "Holiday added successfully" }, status: :created
    else
      errors = @holiday.errors.full_messages + @holiday.holiday_infos.flat_map { |hi| hi.errors.full_messages }
      render json: { errors: }, status: :unprocessable_entity
    end
  end

  private

    def set_year
      @year = params[:holiday][:year]
    end

    def holiday_params
      params.require(:holiday).permit(:year, :enable_optional_holidays, holiday_types: [])
    end

    def holiday_info_params
      params.require(:holiday_info).map do |info|
        info.permit(:name, :date, :category)
      end
    end
end
