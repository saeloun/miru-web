# frozen_string_literal: true

class InternalApi::V1::Recruitments::ConsultanciesController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: Recruitments::ConsultancyPolicy

    consultancies = Consultancy.where(
      params[:q].present? ? ["name LIKE ?",
                             "%#{params[:q]}%"] : {}).where(discarded_at: nil).distinct
    consultancy_details = consultancies.map	{	|consultancy|	consultancy.consultancy_detail }
    render json: { consultancy_details: }, status: :ok
  end

  def create
    authorize :create, policy_class: Recruitments::ConsultancyPolicy
    render :create, locals: {
      consultancy: Consultancy.create!(consultancy_params)
    }
  end

  def show
    authorize :show, policy_class: Recruitments::ConsultancyPolicy
    consultancy_details = consultancy.consultancy_detail
    render json: { consultancy_details: }, status: :ok
  end

  def update
    authorize :update, policy_class: Recruitments::ConsultancyPolicy

    if consultancy.update!(consultancy_params)
      render json: {
        success: true,
        consultancy:,
        notice: I18n.t("consultancy.update.success.message")
      }, status: :ok
    end
  end

  def destroy
    authorize :destroy, policy_class: Recruitments::ConsultancyPolicy

    if consultancy.discard!
      render json: {
        consultancy:,
        notice: I18n.t("consultancy.delete.success.message")
      }, status: :ok
    end
  end

  private

    def consultancy
      @_consultancy ||= Consultancy.find(params[:id])
    end

    def consultancy_params
      params.require(:consultancy).permit(
        policy("recruitments/consultancy".to_sym).permitted_attributes
      )
    end
end
