# frozen_string_literal: true

# API for Admin and Owner only

class Api::V1::Users::PreviousEmploymentsController < Api::V1::ApplicationController
  before_action :set_user

  def index
    authorize @user, policy_class: Users::PreviousEmploymentPolicy
    previous_employments = @user.previous_employments.order(created_at: :desc)
    render :index, locals: { previous_employments: }, status: 200
  end

  def show
    authorize previous_employment, policy_class: Users::PreviousEmploymentPolicy
    render :show, locals: { previous_employment: }, status: 200
  end

  def update
    authorize previous_employment, policy_class: Users::PreviousEmploymentPolicy
    assign_previous_employment_attributes(previous_employment)
    previous_employment.save!
    render :update, locals: { previous_employment: }, status: 200
  end

  def create
    authorize @user, policy_class: Users::PreviousEmploymentPolicy
    previous_employment = @user.previous_employments.new
    assign_previous_employment_attributes(previous_employment)
    previous_employment.save!
    render :create, locals: { previous_employment: }, status: 201
  end

  private

    def set_user
      @user ||= User.find(params[:user_id])
    end

    def previous_employment
      @previous_employment ||= @user.previous_employments.find(params[:id])
    end

    def assign_previous_employment_attributes(previous_employment)
      previous_employment.company_name = previous_employment_attributes[:company_name]
      previous_employment.role = previous_employment_attributes[:role]
    end

    def previous_employment_attributes
      previous_employment = params.require(:previous_employment)

      {
        company_name: previous_employment[:company_name],
        role: previous_employment[:role],
      }
    end
end
