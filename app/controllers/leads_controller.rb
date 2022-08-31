# frozen_string_literal: true

class LeadsController < ApplicationController
  def index
    authorize Lead

    render :index, locals: {
      new_lead: Lead.new,
      keep_new_lead_dialog_open: false
    }
  end
end
