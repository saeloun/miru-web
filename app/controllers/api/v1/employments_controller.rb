# frozen_string_literal: true

class Api::V1::EmploymentsController < Api::V1::ApplicationController
  before_action :set_employment, only: [:update, :show]

  def index
    authorize Employment
    render :index, locals: { users: current_company.employees_without_client_role }, status: 200
  end

  def show
    authorize @employment
    render :show
  end

  def update
    authorize @employment
    @employment.update_profile!(employment_params)
    render json: { notice: I18n.t("employment.update.success") }
  end

  private

    def set_employment
      @employment = current_company.employments.kept.find_by!(user_id: params[:id])
    end

    def employment_params
      params.require(:employment).permit(:designation, :employment_type, :joined_at, :resigned_at, :employee_id)
    end
end
