# frozen_string_literal: true

class DevicesController < ApplicationController
  def index
    authorize Device

    query = current_company.users.includes([:avatar_attachment, :roles]).ransack(params[:q])
    teams = query.result(distinct: true)
    render :index, locals: { query:, teams: }
  end

  private

    def devices
      @_devices ||= Device.order(id: :desc)
    end
end
