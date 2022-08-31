# frozen_string_literal: true

class EngagementsController < ApplicationController
  def index
    authorize :engagement

    render :index, locals: { embed_url: ENV.fetch("POWERBI_EMBED_URL", nil) }
  end

  private

    def leads
      @_leads ||= Lead.order(created_at: :desc)
    end
end
