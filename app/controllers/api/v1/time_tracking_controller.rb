# frozen_string_literal: true

# TODO: Refactoring -> can be merge with time entries controller
class Api::V1::TimeTrackingController < Api::V1::ApplicationController
  skip_after_action :verify_authorized
  before_action :set_user, only: [:index]

  def index
    authorize :index, policy_class: TimeTrackingPolicy
    data = TimeTrackingIndexService.new(
      current_user: current_user,
      user: @user,
      company: current_company,
      from: parsed_date_param(:from) || 1.month.ago.beginning_of_month,
      to: parsed_date_param(:to) || 1.month.since.end_of_month,
      year: params[:year] || Date.today.year
    ).process

    render :index, locals: {
      clients: data[:clients],
      employees: data[:employees],
      entries: data[:entries],
      holiday_infos: data[:holiday_infos],
      leave_types: data[:leave_types],
      projects: data[:projects],
      company: current_company
    }, status: 200
  end

  private

    def set_user
      user_id = params[:user_id] || current_user.id
      @user = current_company.users.find(user_id)
    end

    def parsed_date_param(key)
      value = params[key]
      return if value.blank?

      date_formats.each do |format|
        parsed_date = Date.strptime(value.to_s, format)
        return parsed_date if parsed_date.strftime(format) == value.to_s
      rescue ArgumentError
        next
      end

      Date.iso8601(value.to_s)
    rescue ArgumentError
      nil
    end

    def date_formats
      [
        company_date_format_for_strptime,
        "%Y-%m-%d",
        "%m-%d-%Y",
        "%d-%m-%Y",
        "%m/%d/%Y",
        "%d/%m/%Y"
      ].compact.uniq
    end

    def company_date_format_for_strptime
      {
        "DD-MM-YYYY" => "%d-%m-%Y",
        "MM-DD-YYYY" => "%m-%d-%Y",
        "YYYY-MM-DD" => "%Y-%m-%d"
      }[current_company.date_format]
    end
end
