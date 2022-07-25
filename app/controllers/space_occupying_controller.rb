# frozen_string_literal: true

class SpaceOccupyingController < ApplicationController
  include Timesheet
  skip_after_action :verify_authorized
  before_action :can_access

  def index
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
    render :index, locals: { is_admin:, entries:, employees:, user_id: }
  end

  private

    def can_access
      redirect_to dashboard_index_path,
        flash: { error: "You are not authorized for Space." } unless current_user.can_access_space_usage?
    end
end
