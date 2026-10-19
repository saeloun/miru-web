# frozen_string_literal: true

class Api::V1::ConsultantPayrollController < Api::V1::ApplicationController
  include ActionController::RequestForgeryProtection
  self.allow_forgery_protection = ActionController::Base.allow_forgery_protection
  protect_from_forgery with: :exception, only: [:create, :preview], unless: :token_authenticated_request?
  before_action -> { response.headers["Cache-Control"] = "private, no-store" }
  rescue_from Payroll::ConsultantReview::InvalidInput do |error|
    render json: { errors: error.message }, status: 422
  end
  rescue_from Payroll::Entitlement::NotEnabled do |error|
    render json: { errors: error.message }, status: 403
  end

  def index
    authorize :consultant_payroll
    month, cutoff = Payroll::ConsultantReview.period(params[:month], params[:cutoff])
    records = current_company.employments.joins(:consultant_compensations).distinct.includes(:user)
      .where("employments.joined_at IS NULL OR employments.joined_at <= ?", month.end_of_month)
      .where("employments.resigned_at IS NULL OR employments.resigned_at >= ?", month)
    pages = [(records.count / 30.0).ceil, 1].max
    page = page_number(pages)
    render json: {
      reviews: records.order(:id).limit(30).offset((page - 1) * 30).map do |employment|
        Payroll::ConsultantReview.new(employment:, month:, cutoff:).process
      end,
      employments: staff_choices, pagination: { page:, pages: }, company_id: current_company.id
    }
  end

  def create
    authorize :consultant_payroll
    return unless matching_company?(term_params[:company_id])

    employment = current_company.employments.kept.find(params[:id])
    raise ActiveRecord::RecordNotFound unless staff_member?(employment)

    record = employment.consultant_compensations.create!(term_params.except(:company_id).merge(created_by: current_user))
    render json: { compensation: details(record) }, status: 201
  end

  def history
    authorize :consultant_payroll
    employment = current_company.employments.find(params[:id])
    records = employment.consultant_compensations.includes(:created_by)
    pages = [(records.count / 30.0).ceil, 1].max
    page = page_number(pages)
    render json: { compensations: records.order(effective_on: :desc, id: :desc).limit(30).offset((page - 1) * 30).map { |record| details(record) }, pagination: { page:, pages: } }
  end

  def preview
    authorize :consultant_payroll
    payload = params.require(:payroll_preview)
    raise Payroll::ConsultantReview::InvalidInput, "Provide a payroll preview object" unless payload.is_a?(ActionController::Parameters)

    if (payload.key?(:expense_ids) && !payload[:expense_ids].is_a?(Array)) ||
        (payload.key?(:confirmed_unpaid_hours) && !payload[:confirmed_unpaid_hours].is_a?(String))
      raise Payroll::ConsultantReview::InvalidInput, "Provide unpaid hours as a decimal string and claims as a list"
    end
    inputs = payload.permit(:company_id, :month, :cutoff, :confirmed_unpaid_hours, :unpaid_reason, expense_ids: [])
    return unless matching_company?(inputs[:company_id])

    employment = current_company.employments.find(params[:id])
    month, cutoff = Payroll::ConsultantReview.period(inputs[:month], inputs[:cutoff])
    render json: { review: Payroll::ConsultantReview.new(employment:, month:, cutoff:, inputs:).process }
  end

  private

    def matching_company?(id)
      return true if id.to_s == current_company.id.to_s

      render json: { errors: "Workspace changed. Reload before continuing." }, status: 409
      false
    end

    def page_number(pages)
      value = params[:page] || "1"
      raise Payroll::ConsultantReview::InvalidInput, "Invalid page" unless value.is_a?(String) && value.match?(/\A\d+\z/)

      [[value.to_i, 1].max, pages].min
    end

    def term_params
      params.expect(consultant_compensation: [:company_id, :monthly_fee, :effective_on, :hours_per_day,
        :legal_entity_name, :payment_source, :change_reason, { weekdays: [] }])
    end

    def staff_member?(employment)
      !employment.user.discarded? && SalarySlipPolicy::STAFF_ROLES.any? { |role| employment.user.has_cached_role?(role, current_company) }
    end

    def staff_choices
      current_company.employments.kept.includes(:user).filter_map do |employment|
        { id: employment.id, name: employment.user.full_name } if staff_member?(employment)
      end
    end

    def details(record)
      { id: record.id, effective_on: record.effective_on.iso8601, monthly_fee: record.monthly_fee.to_s("F"),
        hours_per_day: record.hours_per_day.to_s("F"), weekdays: record.weekdays, payment_source: record.payment_source,
        legal_entity_name: record.legal_entity_name, change_reason: record.change_reason,
        created_at: record.created_at.iso8601, created_by: record.created_by.full_name }
    end
end
