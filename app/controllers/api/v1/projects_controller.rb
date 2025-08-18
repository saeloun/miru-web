# frozen_string_literal: true

class Api::V1::ProjectsController < Api::V1::ApplicationController
  before_action :authenticate_user!
  after_action :verify_authorized

  def index
    authorize Project

    # Search projects using ransack or pg_search
    projects = if params[:search_term].present?
      current_company.projects.kept.search(params[:search_term])
    else
      current_company.projects.kept
    end

    projects = projects.includes(:client, :project_members, { project_members: :user }, :timesheet_entries)

    render json: {
      projects: projects.map { |project| serialize_project(project) },
      meta: {
        total: projects.count,
        billable_amount: calculate_billable_amount(projects)
      }
    }, status: 200
  end

  def show
    authorize project

    render json: {
      project: serialize_project(project),
      team_member_details: project.project_members_snippet(params[:time_frame]),
      total_duration: project.total_logged_duration(params[:time_frame]),
      overdue_and_outstanding_amounts: project.overdue_and_outstanding_amounts
    }, status: 200
  end

  def create
    authorize Project
    project = current_company.projects.create!(project_params)

    render json: {
      project: serialize_project(project),
      notice: I18n.t("projects.create.success")
    }, status: 201
  end

  def update
    authorize project
    project.update!(project_params)

    render json: {
      project: serialize_project(project),
      notice: I18n.t("projects.update.success")
    }, status: 200
  end

  def destroy
    authorize project
    render json: { notice: I18n.t("projects.delete.success.message") }, status: 200 if project.discard!
  end

  private

    def project
      @_project ||= current_company.projects.includes(:project_members, project_members: [:user]).find(params[:id])
    end

    def project_params
      params.require(:project).permit(
        policy(Project).permitted_attributes
      )
    end

    def serialize_project(project)
      total_hours = project.timesheet_entries.sum(:duration) || 0

      {
        id: project.id,
        name: project.name,
        client: {
          id: project.client_id,
          name: project.client&.name,
          email: project.client&.email
        },
        client_name: project.client&.name,
        billable: project.billable,
        description: project.description,
        status: project.discarded? ? "archived" : "active",
        totalHours: total_hours,
        allocatedHours: 100, # Default allocated hours, can be customized per project
        teamMembers: project.project_members.includes(:user).map do |member|
          {
            id: member.user.id,
            name: member.user.full_name,
            email: member.user.email
          }
        end,
        team_size: project.project_members.count,
        total_hours: total_hours,
        total_minutes: (total_hours * 60).to_i,
        created_at: project.created_at,
        updated_at: project.updated_at
      }
    end

    def calculate_billable_amount(projects)
      # Calculate billable amount based on timesheet entries
      # Since projects don't have hourly_rate, we'd need to get it from project_members or client rates
      projects.joins(:timesheet_entries)
              .where(timesheet_entries: { bill_status: "billable" })
              .sum("timesheet_entries.duration")
    end

    def current_company
      @_current_company ||= current_user.current_workspace
    end
end
