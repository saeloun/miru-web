# frozen_string_literal: true

class InternalApi::V1::TimeoffEntriesController < InternalApi::V1::ApplicationController
  before_action :load_user!, only: [:create, :update]
  before_action :load_leave_type!, only: [:create, :update]
  before_action :load_holiday_info!, only: [:create, :update]
  before_action :load_timeoff_entry!, only: [:update, :destroy]

  def index
    authorize TimeoffEntry

    data = TimeoffEntries::IndexService.new(current_user, current_company, params[:user_id], params[:year]).process

    render :index, locals: {
      timeoff_entries: data[:timeoff_entries],
      employees: data[:employees],
      leave_balance: data[:leave_balance],
      total_timeoff_entries_duration: data[:total_timeoff_entries_duration],
      optional_timeoff_entries: data[:optional_timeoff_entries],
      national_timeoff_entries: data[:national_timeoff_entries]
    }, status: :ok
  end

  def create
    authorize TimeoffEntry

    timeoff_entry = @user.timeoff_entries.create!(timeoff_params)
    render json: { notice: "Added time off successfully", timeoff_entry: }, status: :ok
  end

  def update
    authorize @timeoff_entry

    @timeoff_entry.update!(timeoff_params)
    render json: { notice: "Updated time off successfully", timeoff_entry: @timeoff_entry }, status: :ok
  end

  def destroy
    authorize @timeoff_entry

    @timeoff_entry.discard!
    render json: { notice: "Deleted time off successfully", timeoff_entry: @timeoff_entry }, status: :ok
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
        @hoiday_info ||= current_company.holiday_infos.find(params[:timeoff_entry][:holiday_info_id])
      end
    end

    def load_timeoff_entry!
      @timeoff_entry ||= TimeoffEntry.find(params[:id])
    end
end
