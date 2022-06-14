# frozen_string_literal: true

class InternalApi::V1::Recruitments::CandidatesController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: Recruitments::CandidatePolicy

    candidates = Candidate.where(
      params[:q].present? ? ["first_name LIKE ?",
                             "%#{params[:q]}%"] : {}).where(discarded_at: nil).distinct
    candidate_details = candidates.map	{	|candidate|	candidate.candidate_detail }
    render json: { candidate_details: }, status: :ok
  end

  def create
    authorize :create, policy_class: Recruitments::CandidatePolicy
    render :create, locals: {
      candidate: Candidate.create!(candidate_params)
    }
  end

  def show
    authorize :show, policy_class: Recruitments::CandidatePolicy
    candidate_details = candidate.candidate_detail
    render json: { candidate_details: }, status: :ok
  end

  def update
    authorize :update, policy_class: Recruitments::CandidatePolicy

    if candidate.update!(candidate_params)
      render json: {
        success: true,
        candidate:,
        notice: I18n.t("candidate.update.success.message")
      }, status: :ok
    end
  end

  def destroy
    authorize :destroy, policy_class: Recruitments::CandidatePolicy

    if candidate.discard!
      render json: {
        candidate:,
        notice: I18n.t("candidate.delete.success.message")
      }, status: :ok
    end
  end

  private

    def candidate
      @_candidate ||= Candidate.find(params[:id])
    end

    def candidate_params
      params.require(:candidate).permit(
        policy("recruitments/candidate".to_sym).permitted_attributes
      )
    end
end
