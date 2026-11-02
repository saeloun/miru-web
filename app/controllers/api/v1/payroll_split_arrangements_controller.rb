# frozen_string_literal: true

class Api::V1::PayrollSplitArrangementsController < Api::V1::PayrollBaseController
  before_action :set_payroll_run

  def create
    authorize @payroll_run, :split_arrangements?
    values = params.expect(payroll_split_arrangement: [:employment_id, :allocation_kind, :allocation_value, :allocated_to, :remainder_to,
      :account_number_confirmation, *PayrollSplitArrangement::DETAIL_KEYS])
    arrangement = service.request!(actor: current_user, employment_id: values[:employment_id],
      attributes: values.slice(:allocation_kind, :allocation_value, :allocated_to, :remainder_to).to_h.symbolize_keys,
      details: values.slice(*PayrollSplitArrangement::DETAIL_KEYS).to_h, account_number_confirmation: values[:account_number_confirmation])
    render json: { split_arrangement: { id: arrangement.id.to_s } }, status: 201
  end

  def verify
    authorize @payroll_run, :split_arrangements?
    service.verify!(actor: current_user, arrangement_id: params[:id])
    render json: { status: "verified" }
  end

  def approve
    authorize @payroll_run, :manage_mercury?
    service.approve!(actor: current_user, arrangement_id: params[:id])
    render json: { status: "approved" }
  end

  def withdraw
    authorize @payroll_run, :manage_mercury?
    service.withdraw!(actor: current_user, arrangement_id: params[:id])
    render json: { status: "withdrawn" }
  end

  private

    def service
      Payroll::SplitArrangements.new(@payroll_run)
    end
end
