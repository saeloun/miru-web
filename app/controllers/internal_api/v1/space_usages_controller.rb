# frozen_string_literal: true

require "rest-client"

class InternalApi::V1::SpaceUsagesController < InternalApi::V1::ApplicationController
  include Timesheet

  skip_after_action :verify_authorized, only: [:index]
  # after_action :verify_policy_scoped, only: [:index]

  def index
    authorize SpaceUsage

    is_admin = current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    employees = is_admin ? current_company.users.select(:id, :first_name, :last_name) : [current_user]

    space_usages = SpaceUsage.during(
      params[:from],
      params[:to]).order(id: :desc)
    entries = formatted_entries_by_date(space_usages)
    render json: {
      entries:,
      employees:,
      departments: User::DEPARTMENT_OPTIONS,
      space_codes: SpaceUsage::SPACE_CODE_OPTIONS,
      purpose_codes: SpaceUsage::PURPOSE_CODE_OPTIONS
    }, status: :ok
  end

  def create
    authorize SpaceUsage
    space_usage = current_company.space_usages.new(space_usage_params)
    space_usage.user = current_company.users.find(params[:user_id])
    if space_usage.save
      render json: {
        notice: I18n.t("space_usage.create.message"),
        entry: space_usage.formatted_entry
      }
    else
      render json: { error: space_usage.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def update
    authorize current_space_usage
    if current_space_usage.update(space_usage_params)
      render json: {
        notice: I18n.t("space_usage.update.message"),
        entry: current_space_usage.formatted_entry
      }, status: :ok
    else
      render json: { error: current_space_usage.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize current_space_usage
    if current_space_usage.destroy
      SpaceUsageSlackNotifyJob.perform_later("delete", current_space_usage.attributes.as_json)
      render json: { notice: I18n.t("space_usage.destroy.message") }
    else
      # TBD
      render json: { error: current_space_usage.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  private

    def current_space_usage
      @_current_space_usage ||= current_company.space_usages.find(params[:id])
    end

    def space_usage_params
      params.require(:space_usage).permit(
        :space_code, :purpose_code,
        :start_duration, :end_duration, :work_date, :note, :restricted, team_members: []
      )
    end
end
