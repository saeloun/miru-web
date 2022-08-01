# frozen_string_literal: true

# API for Admin and Owner only

class InternalApi::V1::Users::PreviousEmploymentsController < InternalApi::V1::ApplicationController
  before_action :set_user

  def index
    authorize PreviousEmployment, policy_class: Users::PreviousEmploymentPolicy
    previous_employments = @user.previous_employments
    render :index, locals: { previous_employments: }, status: :ok
  end

  def show
    authorize previous_employment, policy_class: Users::PreviousEmploymentPolicy
    render :show, locals: { previous_employment: }, status: :ok
  end

  def update
    authorize previous_employment, policy_class: Users::PreviousEmploymentPolicy
    previous_employment.update!(previous_employment_params)
    render :update, locals: { previous_employment: }, status: :ok
  end

  def create
    authorize PreviousEmployment, policy_class: Users::PreviousEmploymentPolicy
    previous_employment = @user.previous_employments.new(previous_employment_params)
    previous_employment.save!
    render :create, locals: { previous_employment: }, status: :ok
 end

  private

    def set_user
      @user ||= User.find(params[:user_id])
    end

    def previous_employment
      @previous_employment ||= @user.previous_employments.find(params[:id])
    end

    def previous_employment_params
      params.require(:previous_employment).permit(
        :company_name, :role
      )
    end
end
