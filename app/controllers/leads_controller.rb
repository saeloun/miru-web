# frozen_string_literal: true

class LeadsController < ApplicationController
  skip_after_action :verify_authorized, except: [:create, :items]

  def index
    render :index, locals: {
      leads:,
      new_lead: Lead.new,
      keep_new_lead_dialog_open: false
    }
  end

  private

    def leads
      @_leads ||= Lead.order(created_at: :desc)
    end
end
