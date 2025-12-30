# frozen_string_literal: true

class BulkHolidayService
  attr_reader :year, :holiday_params, :current_company
  attr_accessor :holiday, :errors

  def initialize(year, holiday_params, current_company)
    @year = year
    @holiday_params = holiday_params
    @current_company = current_company
    @errors = { add_holiday_infos: {}, update_holiday_infos: {} }
  end

  def process
    ActiveRecord::Base.transaction do
      create_or_update_holiday
      add_holiday_info
      update_holiday_info
      remove_holiday_info
      raise ActiveRecord::Rollback if errors_present?
    end
    !errors_present?
  end

  def errors_present?
    errors[:add_holiday_infos].present? || errors[:update_holiday_infos].present?
  end

  private

    def create_or_update_holiday
      @holiday = current_company.holidays.find_by(year:)
      if holiday
        @holiday.update!(holiday_params[:holiday])
      else
        @holiday = current_company.holidays.create!(holiday_params[:holiday])
      end
    end

    def add_holiday_info
      return if holiday_params[:add_holiday_infos].blank?

      holiday_params[:add_holiday_infos].each_with_index do |info, index|
        holiday_info = holiday.holiday_infos.build(info)
        unless holiday_info.valid?
          errors[:add_holiday_infos][index] = holiday_info.errors.messages
          next
        end
        unless holiday_info.save
          errors[:add_holiday_infos][index] = holiday_info.errors.messages
        end
      end
    end

    def update_holiday_info
      return if holiday_params[:update_holiday_infos].blank?

      holiday_params[:update_holiday_infos].each_with_index do |info, index|
        holiday_info = holiday.holiday_infos.find_by(id: info[:id])

        next unless holiday_info

        holiday_info.assign_attributes(info)
        unless holiday_info.valid?
          errors[:update_holiday_infos][index] = holiday_info.errors.messages
          next
        end
        unless holiday_info.save
          errors[:update_holiday_infos][index] = holiday_info.errors.messages
        end
      end
    end

    def remove_holiday_info
      return if holiday_params[:remove_holiday_infos].blank?

      holiday.holiday_infos.where(id: holiday_params[:remove_holiday_infos]).discard_all
    end
end
