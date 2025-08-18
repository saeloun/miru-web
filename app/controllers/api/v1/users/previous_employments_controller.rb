# frozen_string_literal: true

module Api
  module V1
    module Users
      class PreviousEmploymentsController < Api::V1::BaseController
        before_action :authenticate_user!
        before_action :set_user
        before_action :set_previous_employment, only: [:show, :update]

        after_action :verify_authorized, except: :index

        def index
          @previous_employments = @user.previous_employments.order(created_at: :desc)
          render json: {
            previous_employments: @previous_employments.map { |pe| previous_employment_details(pe) }
          }, status: 200
        end

        def show
          authorize @previous_employment
          render json: { previous_employment: previous_employment_details(@previous_employment) }, status: 200
        end

        def create
          @previous_employment = @user.previous_employments.build(previous_employment_params)
          authorize @previous_employment

          if @previous_employment.save
            render json: {
              previous_employment: previous_employment_details(@previous_employment),
              notice: "Previous employment added successfully"
            }, status: 201
          else
            render json: { errors: @previous_employment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          authorize @previous_employment

          if @previous_employment.update(previous_employment_params)
            render json: {
              previous_employment: previous_employment_details(@previous_employment),
              notice: "Previous employment updated successfully"
            }, status: 200
          else
            render json: { errors: @previous_employment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

          def set_user
            @user = User.find(params[:user_id])
          end

          def set_previous_employment
            @previous_employment = @user.previous_employments.find(params[:id])
          end

          def previous_employment_params
            params.require(:previous_employment).permit(
              :company_name, :role
            )
          end

          def previous_employment_details(previous_employment)
            {
              id: previous_employment.id,
              user_id: previous_employment.user_id,
              company_name: previous_employment.company_name,
              role: previous_employment.role,
              created_at: previous_employment.created_at,
              updated_at: previous_employment.updated_at
            }
          end
      end
    end
  end
end
