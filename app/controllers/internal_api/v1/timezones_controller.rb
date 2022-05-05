# frozen_string_literal: true

class InternalApi::V1::TimezonesController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:index]

  def index
    timezones = Hash.new([])
    ISO3166::Country.pluck(:alpha2).map do |alpha_arr|
      alpha_name = alpha_arr.first
      timezones[alpha_name] = ActiveSupport::TimeZone.country_zones(alpha_name).map { |tz| tz.to_s }
    end
    render json: { timezones: }, status: :ok
  end
end
