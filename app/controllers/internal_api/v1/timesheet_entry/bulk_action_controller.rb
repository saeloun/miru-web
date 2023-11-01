# frozen_string_literal: true

class InternalApi::V1::TimesheetEntry::BulkActionController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:update, :destroy]
  after_action :verify_policy_scoped, only: [:update, :destroy]

  def create
    authorize TimesheetEntry

    entries_data = timesheet_entry_params[:timesheet_entry]
    user_id = params[:user_id]

    CreateBulkTimeEntriesService.new(entries_data:, user_id:).process

    render json: {
      notice: I18n.t("timesheet_entry.create.message"),
      entries: entries_data.map { |entry_data| entry_data[:snippet] }
    }
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: "An error occurred while trying to add meetings. Please try again." },
      status: :unprocessable_entity
  end

  def update
    timesheet_entries = policy_scope(TimesheetEntry)
    timesheet_entries.where(id: params[:ids]).update(project_id: params[:project_id])
    entries = TimesheetEntriesPresenter.new(timesheet_entries).group_snippets_by_work_date
    render json: { notice: I18n.t("timesheet_entry.update.message"), entries: }, status: :ok
  end

  def destroy
    timesheet_entries = policy_scope(TimesheetEntry)
    if timesheet_entries.where(id: ids_params).destroy_all
      render json: { notice: I18n.t("timesheet_entry.destroy.message") }
    end
  end

  private

    def ids_params
      params.require(:source).require(:ids)
    end

    def timesheet_entry_params
      params.require(:bulk_action).permit(
        :user_id, timesheet_entry: [:project_id, :duration, :work_date, :note, :bill_status]
      )
    end
end
