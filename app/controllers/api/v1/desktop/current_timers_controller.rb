# frozen_string_literal: true

class Api::V1::Desktop::CurrentTimersController < Api::V1::ApplicationController
  skip_after_action :verify_authorized

  DEFAULT_TIMER = {
    "billable" => false,
    "elapsed_ms" => 0,
    "notes" => "",
    "project_name" => "",
    "running" => false,
    "started_at" => nil,
    "task_name" => ""
  }.freeze

  def show
    render json: { current_timer: timer_payload }, status: 200
  end

  def update
    current_timer_record.update!(current_timer: sanitized_current_timer)

    render json: { current_timer: timer_payload }, status: 200
  end

  private

    def current_timer_record
      @_current_timer_record ||= DesktopCurrentTimer.find_or_initialize_by(
        company: current_company,
        user: current_user
      )
    end

    def timer_payload
      DEFAULT_TIMER.merge(current_timer_record.current_timer || {})
    end

    def sanitized_current_timer
      timer_params = params.require(:current_timer).permit(
        :billable,
        :elapsed_ms,
        :notes,
        :project_name,
        :running,
        :started_at,
        :task_name
      )

      {
        "billable" => ActiveModel::Type::Boolean.new.cast(timer_params[:billable]),
        "elapsed_ms" => [timer_params[:elapsed_ms].to_i, 0].max,
        "notes" => timer_params[:notes].to_s.first(2_000),
        "project_name" => timer_params[:project_name].to_s.first(200),
        "running" => ActiveModel::Type::Boolean.new.cast(timer_params[:running]),
        "started_at" => parsed_started_at(timer_params[:started_at]),
        "task_name" => timer_params[:task_name].to_s.first(120)
      }
    end

    def parsed_started_at(value)
      return if value.blank?

      Time.zone.parse(value.to_s)&.iso8601(3)
    rescue ArgumentError
      nil
    end
end
