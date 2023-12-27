# frozen_string_literal: true

class InternalApi::V1::TimeoffEntriesController < InternalApi::V1::ApplicationController
  before_action :load_user!, only: [:create, :update]
  before_action :load_leave_type!, only: [:create, :update]
  before_action :load_timeoff_entry!, only: [:update, :destroy]

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
      @leave_type ||= current_company.leave_types.find(params[:timeoff_entry][:leave_type_id])
    end

    def load_timeoff_entry!
      @timeoff_entry ||= current_company.timeoff_entries.find(params[:id])
    end
end
