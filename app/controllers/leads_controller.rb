# frozen_string_literal: true

class LeadsController < ApplicationController
  skip_after_action :verify_authorized, except: [:create, :items]
  before_action :can_access

  def index
    render :index, locals: {
      leads:,
      new_lead: Lead.new,
      keep_new_lead_dialog_open: false
    }
  end

  private

    def can_access
      redirect_to dashboard_index_path,
        flash: { error: "You are not authorized for Lead." } unless current_user.can_access_lead?
    end

    def leads
      @_leads ||= Lead.order(created_at: :desc)
    end
end
