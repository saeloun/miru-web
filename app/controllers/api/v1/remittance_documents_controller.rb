# frozen_string_literal: true

class Api::V1::RemittanceDocumentsController < Api::V1::PayrollBaseController
  def index
    authorize current_company, :index?, policy_class: PayrollRemittanceDocumentPolicy
    scope = PayrollPaymentInstruction.where(company_id: payroll_workspace_id, submission_state: "accepted")
    if params[:payment_instruction_id].present?
      scope = scope.where(id: exact_id(params[:payment_instruction_id]))
      authorize scope.first!, :show?, policy_class: PayrollRemittanceDocumentPolicy
    elsif params[:invoice_id].present?
      invoice = PayrollConsultantInvoice.where(company_id: payroll_workspace_id).find(exact_id(params[:invoice_id]))
      authorize invoice, :show?, policy_class: PayrollConsultantInvoicePolicy
      scope = scope.where(payroll_payment_group_id: invoice.payroll_payment_group_id, payroll_run_id: invoice.payroll_run_id, employment_id: invoice.employment_id)
    else
      scope = scope.where(employment_id: Employment.kept.where(company_id: payroll_workspace_id, user_id: current_user.id).select(:id))
    end
    pages = [(scope.count / 20.0).ceil, 1].max
    page = [exact_id(params[:page] || "1"), pages].min
    rows = scope.order(id: :desc).limit(21).offset((page - 1) * 20).to_a
    render json: { payments: rows.first(20).map { |leg| service(leg).summary }, page:, has_more: rows.size > 20 }
  end

  def create
    leg = payment_instruction
    authorize leg, :create?, policy_class: PayrollRemittanceDocumentPolicy
    input = params.require(:remittance_document)
    allowed = %w[kind reason expected_document_id idempotency_key file]
    raise Payroll::ConsultantReview::InvalidInput, "Provide only the named document fields" unless input.is_a?(ActionController::Parameters) && input.keys.sort == allowed.sort

    service(leg).record!(kind: input[:kind], reason: input[:reason], expected_document_id: input[:expected_document_id],
      idempotency_key: input[:idempotency_key], file: input[:file])
    render json: { payment: service(leg).summary }, status: 201
  end

  def download
    leg = payment_instruction
    authorize leg, :show?, policy_class: PayrollRemittanceDocumentPolicy
    bytes, type, filename = service(leg).download(exact_id(params[:id]))
    with_download_workspace do
      authorize leg.reload, :show?, policy_class: PayrollRemittanceDocumentPolicy
      response.headers["X-Content-Type-Options"] = "nosniff"
      send_data bytes, type:, filename:, disposition: "attachment"
    end
  rescue ActiveStorage::FileNotFoundError, Payroll::Workflow::Conflict
    render json: { errors: "Private remittance evidence is unavailable" }, status: 404
  end

  private

    def verify_payroll_workspace
      return if params[:company_id].is_a?(String) && current_company && params[:company_id] == payroll_workspace_id.to_s

      skip_authorization
      render json: { errors: "Remittance workspace changed; reload the current workspace" }, status: 409
    end

    def exact_id(value)
      raise ActiveRecord::RecordNotFound unless value.is_a?(String) && value.match?(/\A[1-9]\d{0,18}\z/) && value.to_i <= 9_223_372_036_854_775_807

      value.to_i
    end

    def payment_instruction
      PayrollPaymentInstruction.where(company_id: payroll_workspace_id).find(exact_id(params[:payment_instruction_id]))
    end

    def service(leg)
      Payroll::RemittanceDocuments.new(leg, actor: current_user)
    end
end
