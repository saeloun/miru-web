# frozen_string_literal: true

class InternalApi::V1::EmploymentsController < InternalApi::V1::ApplicationController
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
    @employment.update!(employment_params)
    render json: { notice: I18n.t("employment.update.success") }
  end

  private

    def set_employment
      @employment = Employment.find_by!(user_id: params[:id], company_id: current_company.id)
    end

    def employment_params
      params.require(:employment).permit(:designation, :employment_type, :joined_at, :resigned_at, :employee_id)
    end
end
