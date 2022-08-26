# frozen_string_literal: true

class DevicesController < ApplicationController
  # skip_after_action :verify_authorized
  before_action :can_access

  def index
    query = current_company.users.includes([:avatar_attachment, :roles]).ransack(params[:q])
    teams = query.result(distinct: true)
    render :index, locals: { query:, teams: }
  end

  private

    def can_access
      redirect_to dashboard_index_path,
        flash: { error: "You are not authorized for Devices." } unless current_user.can_access_devices?
    end

    def devices
      @_devices ||= Device.order(id: :desc)
    end
end
