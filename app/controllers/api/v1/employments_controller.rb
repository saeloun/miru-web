# frozen_string_literal: true

class Api::V1::EmploymentsController < Api::V1::BaseController
  before_action :authenticate_user!
  before_action :set_employment, only: [:show, :update]

  after_action :verify_authorized, except: :index

  def index
    @employments = current_user.employments.includes(:company)
    render json: {
      employments: @employments.map { |e| employment_details(e) }
    }, status: 200
  end

  def show
    authorize @employment
    render json: { employment: employment_details(@employment) }, status: 200
  end

  def update
    authorize @employment
    if @employment.update(employment_params)
      render json: {
        employment: employment_details(@employment),
        notice: "Employment details updated successfully"
      }, status: 200
    else
      render json: { errors: @employment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

    def set_employment
      @employment = current_user.employments.find_by(id: params[:id])
      render json: { error: "Employment not found" }, status: 404 unless @employment
    end

    def employment_params
      params.require(:employment).permit(
        :employee_id, :designation, :employment_type, :joined_at, :resigned_at
      )
    end

    def employment_details(employment)
      {
        id: employment.id,
        user_id: employment.user_id,
        company_id: employment.company_id,
        company_name: employment.company&.name,
        designation: employment.designation,
        employment_type: employment.employment_type,
        joined_at: employment.joined_at,
        resigned_at: employment.resigned_at,
        employee_id: employment.employee_id,
        created_at: employment.created_at,
        updated_at: employment.updated_at
      }
    end
end
