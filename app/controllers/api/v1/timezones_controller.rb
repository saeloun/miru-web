# frozen_string_literal: true

class Api::V1::TimezonesController < Api::V1::ApplicationController
  skip_before_action :authenticate_user_using_x_auth_token

  def index
    authorize :index, policy_class: TimezonePolicy

    timezones = ISO3166::Country.pluck(:alpha2).flatten.reduce(Hash.new([])) do |obj, alpha|
      obj[alpha] = ActiveSupport::TimeZone.country_zones(alpha).map(&:to_s)
      obj
    end

    render json: { timezones: }, status: 200
  end
end
