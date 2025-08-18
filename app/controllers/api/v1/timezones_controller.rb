# frozen_string_literal: true

class Api::V1::TimezonesController < Api::V1::ApplicationController
  before_action :authenticate_user!

  def index
    timezones = ActiveSupport::TimeZone.all.map do |tz|
      {
        name: tz.name,
        offset: tz.formatted_offset,
        identifier: tz.tzinfo.identifier,
        label: "(GMT#{tz.formatted_offset}) #{tz.name}"
      }
    end

    render json: { timezones: timezones }
  end
end
