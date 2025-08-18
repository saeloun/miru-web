# frozen_string_literal: true

class Api::V1::LeavesController < Api::V1::ApplicationController
  before_action :authenticate_user!
  before_action :set_leave, only: [:show, :update, :destroy]
  after_action :verify_authorized, except: :index

  def index
    leaves = policy_scope(Leave).includes(:leave_types, :custom_leaves)
    leaves = leaves.where(year: params[:year]) if params[:year].present?

    render json: {
      leaves: leaves.map { |leave|
        {
          id: leave.id,
          year: leave.year,
          company_id: leave.company_id,
          leave_types: leave.leave_types.map { |lt| serialize_leave_type(lt) },
          custom_leaves: leave.custom_leaves.map { |cl| serialize_custom_leave(cl) },
          created_at: leave.created_at,
          updated_at: leave.updated_at
        }
      },
      current_year: Date.current.year
    }
  end

  def show
    authorize @leave
    render json: serialize_leave(@leave)
  end

  def create
    @leave = current_user.leaves.build(leave_params)
    authorize @leave

    if @leave.save
      render json: serialize_leave(@leave), status: 201
    else
      render json: { errors: @leave.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @leave

    if @leave.update(leave_params)
      render json: serialize_leave(@leave)
    else
      render json: { errors: @leave.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @leave
    @leave.destroy
    head 204
  end

  private

    def set_leave
      @leave = Leave.find(params[:id])
    end

    def leave_params
      params.require(:leave).permit(:user_id, :leave_type_id, :year, :total_leaves, :leaves_taken)
    end

    def serialize_leave(leave)
      {
        id: leave.id,
        year: leave.year,
        company_id: leave.company_id,
        leave_types: leave.leave_types.map { |lt| serialize_leave_type(lt) },
        custom_leaves: leave.custom_leaves.map { |cl| serialize_custom_leave(cl) },
        created_at: leave.created_at,
        updated_at: leave.updated_at
      }
    end

    def serialize_leave_type(leave_type)
      {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        allocation_value: leave_type.allocation_value,
        allocation_period: leave_type.allocation_period,
        carry_forward_days: leave_type.carry_forward_days
      }
    end

    def serialize_custom_leave(custom_leave)
      {
        id: custom_leave.id,
        name: custom_leave.name,
        allocation_value: custom_leave.allocation_value,
        allocation_period: custom_leave.allocation_period,
        users: custom_leave.users.map { |u| { id: u.id, name: u.name } }
      }
    end

    def current_company
      @_current_company ||= current_user.current_workspace
    end
end
