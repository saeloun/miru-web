# frozen_string_literal: true

class Api::V1::Hiring::CalendarEventsController < Api::V1::Hiring::BaseController
  include HiringCalendarConnection

  def index
    application = current_company.hiring_applications.find(optional_id(:application_id))
    interview = application.hiring_interviews.find(optional_id(:interview_id))
    scheduling = Hiring::Scheduling.new(interview:, actor: current_user)
    context = scheduling.calendar_context
    unless hiring_calendar_connection.configured?
      render json: { company_id: current_company.id, connected: false, reason: "unconfigured" }
      return
    end

    calendar = hiring_calendar_events(context)
    result = if params[:calendar_id].present?
      calendar.events(calendar_id: params[:calendar_id], from: params[:from], page_token: params[:page_token])
    else
      calendar.calendars(page_token: params[:page_token])
    end
    unless context == scheduling.calendar_context
      raise Hiring::Intake::Conflict, "The candidate or panel changed. Search again before importing."
    end
    current_user.update!(calendar_connected: true) unless current_user.calendar_connected?

    render json: result.merge(company_id: current_company.id, connected: true,
      application_version: context.fetch(:application_version), interview_version: context.fetch(:interview_version))
  rescue Calendars::Connection::Disconnected
    hiring_calendar_connection.disconnect!
    render json: { company_id: current_company.id, connected: false, reason: "disconnected" }
  end
end
