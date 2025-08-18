# frozen_string_literal: true

class Api::V1::TeamController < Api::V1::ApplicationController
  before_action :authenticate_user!
  after_action :verify_authorized, except: [:index]

  def index
    team_members = current_company.employments.kept.includes(user: [:timesheet_entries, :project_members]).map do |employment|
      user = employment.user

      # Calculate hours for current month
      current_month_start = Date.current.beginning_of_month
      current_month_end = Date.current.end_of_month

      current_month_entries = user.timesheet_entries
        .where(work_date: current_month_start..current_month_end)

      total_hours = current_month_entries.sum(:duration) / 60.0 # Convert minutes to hours
      billable_hours = current_month_entries.where(bill_status: ["unbilled", "billed"]).sum(:duration) / 60.0

      # Get active projects count
      active_projects_count = user.project_members.joins(:project).where(projects: { discarded_at: nil }).count

      {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: employment.employment_type || "employee",
        designation: employment.designation,
        department: nil, # Add department field to Employment model if needed
        status: employment.discarded? ? "archived" : "active",
        profilePicture: user.avatar_url,
        isTeamMember: true,
        employmentType: employment.employment_type || "employee",
        joinedAtDate: employment.joined_at&.to_s || employment.created_at.to_s,
        hoursLogged: total_hours.round(1),
        billableHours: billable_hours.round(1),
        projects: active_projects_count
      }
    end

    render json: {
      combinedDetails: team_members
    }
  end

  def update
    employment = current_company.employments.kept.find_by!(user_id: params[:id])
    authorize employment, policy_class: TeamPolicy

    employment.update!(employment_params)

    render json: {
      success: true,
      message: "Team member updated successfully"
    }
  end

  def destroy
    employment = current_company.employments.kept.find_by!(user_id: params[:id])
    authorize employment, policy_class: TeamPolicy

    employment.discard!

    render json: {
      success: true,
      message: "Team member removed successfully"
    }
  end

  private

    def employment_params
      params.permit(:employment_type, :joined_at)
    end
end
