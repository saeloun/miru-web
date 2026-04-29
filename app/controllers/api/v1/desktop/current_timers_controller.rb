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
    "synced_at" => nil,
    "task_name" => "",
    "timer_deck" => nil
  }.freeze

  TIMER_DECK_VERSION = 2

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
        :source,
        :started_at,
        :synced_at,
        :task_name,
        timer_deck: [
          :activeTimerId,
          :version,
          { timers: [
            :client,
            :description,
            :elapsedTime,
            :id,
            :isRunning,
            :project,
            :projectId,
            :startTime
          ] }
        ]
      )

      {
        "billable" => ActiveModel::Type::Boolean.new.cast(timer_params[:billable]),
        "elapsed_ms" => [timer_params[:elapsed_ms].to_i, 0].max,
        "notes" => timer_params[:notes].to_s.first(2_000),
        "project_name" => timer_params[:project_name].to_s.first(200),
        "running" => ActiveModel::Type::Boolean.new.cast(timer_params[:running]),
        "source" => timer_params[:source].presence&.to_s&.first(40),
        "started_at" => parsed_started_at(timer_params[:started_at]),
        "synced_at" => parsed_started_at(timer_params[:synced_at]) || Time.current.iso8601(3),
        "task_name" => timer_params[:task_name].to_s.first(120),
        "timer_deck" => sanitized_timer_deck(timer_params[:timer_deck])
      }
    end

    def sanitized_timer_deck(deck_params)
      return if deck_params.blank?

      timers = Array.wrap(deck_params[:timers]).first(10).filter_map do |timer|
        sanitized_timer(timer)
      end
      return if timers.blank?

      active_timer_id = deck_params[:activeTimerId].to_s
      active_timer_id = timers.first["id"] unless timers.any? { |timer| timer["id"] == active_timer_id }

      {
        "activeTimerId" => active_timer_id,
        "timers" => timers,
        "version" => TIMER_DECK_VERSION
      }
    end

    def sanitized_timer(timer)
      timer = timer.to_h
      id = timer_value(timer, :id).presence&.to_s&.first(120)
      return if id.blank?

      {
        "client" => timer_value(timer, :client).to_s.first(200),
        "description" => timer_value(timer, :description).to_s.first(2_000),
        "elapsedTime" => [timer_value(timer, :elapsedTime).to_i, 0].max,
        "id" => id,
        "isRunning" => ActiveModel::Type::Boolean.new.cast(timer_value(timer, :isRunning)),
        "project" => timer_value(timer, :project).to_s.first(200),
        "projectId" => [timer_value(timer, :projectId).to_i, 0].max,
        "startTime" => timer_value(timer, :startTime).present? ? [timer_value(timer, :startTime).to_i, 0].max : nil
      }
    end

    def timer_value(timer, key)
      timer[key.to_s] || timer[key]
    end

    def parsed_started_at(value)
      return if value.blank?

      Time.zone.parse(value.to_s)&.iso8601(3)
    rescue ArgumentError
      nil
    end
end
