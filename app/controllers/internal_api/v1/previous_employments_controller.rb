# frozen_string_literal: true

class InternalApi::V1::PreviousEmploymentsController < InternalApi::V1::ApplicationController
  before_action :set_user, only: %i[index create]

  def index
    authorize @user, policy_class: PreviousEmploymentPolicy
    previous_employments = current_user.previous_employments
    render :index, locals: { previous_employments: }, status: :ok
  end

  def show
    authorize previous_employment
    render :show, locals: { previous_employment: }, status: :ok
  end

  def update
    authorize previous_employment
    previous_employment.update!(previous_employment_params)
    render :update, locals: { previous_employment: }, status: :ok
  end

  def create
    authorize @user, policy_class: PreviousEmploymentPolicy
    previous_employment = current_user.previous_employments.new(previous_employment_params)
    previous_employment.save!
    render :create, locals: { previous_employment: }, status: :ok
 end

  private

    def set_user
      @user ||= User.find(params[:user_id])
    end

    def previous_employment
      @previous_employment ||= PreviousEmployment.find(params[:id])
    end

    def previous_employment_params
      params.require(:previous_employment).permit(
        :company_name, :role
      )
    end
end
