# frozen_string_literal: true

class Api::V1::TimeoffEntriesController < Api::V1::BaseController
  before_action :load_user!, only: [:create, :update]
  before_action :load_leave_type!, only: [:create, :update]
  before_action :load_holiday_info!, only: [:create, :update]
  before_action :load_timeoff_entry!, only: [:update, :destroy]
  after_action :verify_authorized, except: [:index]

  def index
    authorize TimeoffEntry if current_user

    data = TimeoffEntries::IndexDecorator.new(current_user, current_company, params[:user_id], params[:year]).process

    render json: {
      timeoff_entries: data[:timeoff_entries].map do |entry|
        {
          id: entry.id,
          user_id: entry.user_id,
          leave_type_id: entry.leave_type_id,
          holiday_info_id: entry.holiday_info_id,
          start_date: entry.leave_date,
          end_date: entry.leave_date,
          leave_date: entry.leave_date,
          duration: entry.duration,
          note: entry.note,
          leave_type: entry.leave_type&.name,
          user_name: entry.user&.full_name,
          holiday_info: entry.holiday_info&.name
        }
      end,
      employees: data[:employees].map do |user|
        {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: user.full_name
        }
      end,
      leave_balance: data[:leave_balance],
      total_timeoff_entries_duration: data[:total_timeoff_entries_duration],
      optional_timeoff_entries: data[:optional_timeoff_entries].map do |entry|
        {
          id: entry.id,
          user_id: entry.user_id,
          start_date: entry.leave_date,
          end_date: entry.leave_date,
          leave_date: entry.leave_date,
          duration: entry.duration,
          note: entry.note,
          holiday_info: entry.holiday_info&.name
        }
      end,
      national_timeoff_entries: data[:national_timeoff_entries].map do |entry|
        {
          id: entry.id,
          user_id: entry.user_id,
          start_date: entry.leave_date,
          end_date: entry.leave_date,
          leave_date: entry.leave_date,
          duration: entry.duration,
          note: entry.note,
          holiday_info: entry.holiday_info&.name
        }
      end
    }
  end

  def create
    authorize TimeoffEntry

    timeoff_entry = @user.timeoff_entries.create!(timeoff_params)
    render json: {
      notice: "Added time off successfully",
      timeoff_entry: {
        id: timeoff_entry.id,
        user_id: timeoff_entry.user_id,
        leave_type_id: timeoff_entry.leave_type_id,
        holiday_info_id: timeoff_entry.holiday_info_id,
        start_date: timeoff_entry.leave_date,
        end_date: timeoff_entry.leave_date,
        duration: timeoff_entry.duration,
        note: timeoff_entry.note
      }
    }, status: 200
  end

  def update
    authorize @timeoff_entry

    @timeoff_entry.update!(timeoff_params)
    render json: {
      notice: "Updated time off successfully",
      timeoff_entry: {
        id: @timeoff_entry.id,
        user_id: @timeoff_entry.user_id,
        leave_type_id: @timeoff_entry.leave_type_id,
        holiday_info_id: @timeoff_entry.holiday_info_id,
        start_date: @timeoff_entry.leave_date,
        end_date: @timeoff_entry.leave_date,
        duration: @timeoff_entry.duration,
        note: @timeoff_entry.note
      }
    }, status: 200
  end

  def destroy
    authorize @timeoff_entry

    @timeoff_entry.discard!
    render json: {
      notice: "Deleted time off successfully",
      timeoff_entry: {
        id: @timeoff_entry.id,
        discarded_at: @timeoff_entry.discarded_at
      }
    }, status: 200
  end

  private

    def timeoff_params
      params.require(:timeoff_entry).permit(policy(TimeoffEntry).permitted_attributes)
    end

    def load_user!
      @user ||= current_company.users.find(params[:timeoff_entry][:user_id])
    end

    def load_leave_type!
      if timeoff_params[:leave_type_id].present?
        @leave_type ||= current_company.leave_types.find(params[:timeoff_entry][:leave_type_id])
      end
    end

    def load_holiday_info!
      if timeoff_params[:holiday_info_id].present?
        @holiday_info ||= current_company.holiday_infos.find(params[:timeoff_entry][:holiday_info_id])
      end
    end

    def load_timeoff_entry!
      @timeoff_entry ||= TimeoffEntry.find(params[:id])
    end
end
