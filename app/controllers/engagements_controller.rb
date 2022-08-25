# frozen_string_literal: true

class EngagementsController < ApplicationController
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
        flash: { error: "You are not authorized for Lead." } unless current_user.can_access_engagement?
    end

    def leads
      @_leads ||= Lead.order(created_at: :desc)
    end
end
