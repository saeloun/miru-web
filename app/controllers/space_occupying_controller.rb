# frozen_string_literal: true

class SpaceOccupyingController < ApplicationController
  include Timesheet

  def index
    authorize SpaceUsage

    is_admin = current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    user_id = current_user.id
    employees = is_admin ? current_company.users.select(:id, :first_name, :last_name) : [current_user]

    space_usages = SpaceUsage
      .includes([:user])
      .during(
        1.month.ago.beginning_of_month,
        1.month.since.end_of_month
        ).order(id: :desc)
    entries = formatted_entries_by_date(space_usages)
    render :index, locals: {
      is_admin:, entries:, employees:, user_id:,
      user_department_id: current_user.department_id,
      departments: User::DEPARTMENT_OPTIONS,
      space_codes: SpaceUsage::SPACE_CODE_OPTIONS,
      purpose_codes: SpaceUsage::PURPOSE_CODE_OPTIONS
    }
  end
end
