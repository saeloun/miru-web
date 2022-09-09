# frozen_string_literal: true

class InternalApi::V1::Recruitments::CandidatesController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: Recruitments::CandidatePolicy

    candidates = Candidate.where(
      params[:q].present? ?
        ["first_name LIKE ?", "%#{params[:q]}%"] : {}
    ).where(discarded_at: nil).distinct
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
        candidate_details: candidate,
        notice: I18n.t("candidate.update.success.message")
      }, status: :ok
    end
  end

  def destroy
    authorize :destroy, policy_class: Recruitments::CandidatePolicy

    if candidate.discard!
      render json: {
        candidate_details: candidate,
        notice: I18n.t("candidate.delete.success.message")
      }, status: :ok
    end
  end

  def items
    authorize :items, policy_class: Recruitments::CandidatePolicy

    countries = ISO3166::Country.pluck(:alpha2, :iso_short_name)
    preferred_contact_method_code_names = Candidate::PREFERRED_CONTACT_METHOD_CODE_OPTIONS
    source_codes = Candidate::SOURCE_CODE_OPTIONS
    initial_communications = Candidate::INITIAL_COMMUNICATION_OPTIONS
    tech_stacks = Candidate::TECH_STACK_OPTIONS
    status_codes = Candidate::STATUS_CODE_OPTIONS

    render json: {
      countries:,
      preferred_contact_method_code_names:,
      source_codes:,
      initial_communications:,
      tech_stacks:,
      status_codes:
    },	status: :ok
  end

  def allowed_users
    authorize :allowed_users, policy_class: Recruitments::CandidatePolicy

    sales_department_id = User::DEPARTMENT_OPTIONS.detect { |department| department.name == "Sales" }&.id

    allowed_user_list = User.includes(:roles).where(roles: { name: ["admin", "owner"] })
      .or(User.includes(:roles).where(
        roles: { name: "employee" }, department_id: sales_department_id)
                              ).map { |user| user.attributes.merge({ full_name: user.full_name }) }

    render json: { allowed_user_list: },	status: :ok
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
