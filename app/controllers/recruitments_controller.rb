# frozen_string_literal: true

class RecruitmentsController < ApplicationController
  skip_after_action :verify_authorized

  def index
    render :index, locals: {
      candidates:,
      consultancies:,
      new_candidate: Candidate.new,
      new_consultancy: Consultancy.new,
      keep_new_candidate_dialog_open: false,
      keep_new_consultancy_dialog_open: false
    }
  end

  private

    def candidates
      @_candidates ||= Candidate.order(created_at: :desc)
    end

    def consultancies
      @_consultancies ||= Consultancy.order(created_at: :desc)
    end
end
