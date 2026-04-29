# frozen_string_literal: true

class Api::V1::TimesheetEntry::BulkActionController < Api::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:update, :destroy]
  after_action :verify_policy_scoped, only: [:update, :destroy]

  def update
    authorize TimesheetEntry, :bulk_update?
    timesheet_entries = policy_scope(TimesheetEntry)

    ids = Array(params[:ids]).reject(&:blank?)
    return render json: { error: I18n.t("timesheet_entry.update.failure", default: "No entries selected") }, status: :unprocessable_entity if ids.empty?

    target_project = ProjectPolicy::Scope.new(current_user, current_company).resolve.find(params[:project_id])
    updated_entries = timesheet_entries.where(id: ids)
    return render json: { error: I18n.t("timesheet_entry.update.failure", default: "No entries found") }, status: :unprocessable_entity if updated_entries.empty?
    if standard_user? && updated_entries.any? { |entry| entry_locked_for_standard_user?(entry) }
      return render json: {
        error: I18n.t(
          "timesheet_entry.update.locked",
          default: "Only admins can edit entries older than 7 days"
        )
      }, status: 403
    end

    updated_entries.update(project_id: target_project.id)
    entries = TimesheetEntriesPresenter.new(updated_entries).group_snippets_by_work_date
    render json: { notice: I18n.t("timesheet_entry.update.message"), entries: }, status: 200
  end

  def destroy
    authorize TimesheetEntry, :bulk_destroy?

    timesheet_entries = policy_scope(TimesheetEntry)
    entries_to_discard = timesheet_entries.where(id: ids_params)
    if standard_user? && entries_to_discard.any? { |entry| entry_locked_for_standard_user?(entry) }
      return render json: {
        error: I18n.t(
          "timesheet_entry.destroy.locked",
          default: "Only admins can delete entries older than 7 days"
        )
      }, status: 403
    end
    discarded_entries = entries_to_discard.discard_all
    if discarded_entries.any?
      render json: { notice: I18n.t("timesheet_entry.destroy.message") }
    else
      render json: { error: I18n.t("timesheet_entry.destroy.failure", default: "Failed to delete timesheet entries") }, status: 422
    end
  end

  private

    def ids_params
      params.require(:source).require(:ids)
    end

    def standard_user?
      !current_user.has_role?(:admin, current_company)
    end

    def entry_locked_for_standard_user?(entry)
      entry.work_date.present? && entry.work_date < 7.days.ago.to_date
    end
end
