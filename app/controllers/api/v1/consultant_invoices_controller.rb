# frozen_string_literal: true

class Api::V1::ConsultantInvoicesController < Api::V1::PayrollBaseController
  include ConsultantInvoiceAccess

  def index
    employment = own_employments.order(id: :desc).first!
    authorize employment, :index?, policy_class: PayrollConsultantInvoicePolicy
    count = invoice_scope.count
    page = [invoice_id!(params[:page] || "1"), [(count / 20.0).ceil, 1].max].min
    rows = invoice_scope.order(id: :desc).limit(20).offset((page - 1) * 20)
    pending = preparation_scope.heads.where.not(original_blob_id: nil).order(id: :desc).limit(20)
    render json: { invoices: rows.map { |invoice| invoice_details(invoice) }, page:, has_more: count > page * 20,
      preparations: pending.map { |preparation| preparation_details(preparation).merge(payroll_run_id: preparation.payroll_run_id.to_s, period: preparation.payroll_run.period.strftime("%Y-%m")) },
      available_runs: available_runs, accounts_email: Payroll::ConsultantInvoicePreparation::ACCOUNTS_EMAIL }
  end

  def create
    input = invoice_input!(:invoice_preparation, %w[payroll_run_id employment_id facts expected_revision_digest expected_preparation_id idempotency_key original_pdf])
    run = PayrollRun.where(company_id: payroll_workspace_id).find(invoice_id!(input[:payroll_run_id]))
    employment = own_employments.find(invoice_id!(input[:employment_id]))
    authorize invoice_context(run, employment), :submit_existing?, policy_class: PayrollConsultantInvoicePolicy
    facts = invoice_facts!(input[:facts])
    raise Payroll::ConsultantReview::InvalidInput, "Submit only an existing original invoice for accounts review" unless facts["mode"] == "existing"
    preparation = Payroll::ConsultantInvoicePreparation.new(run, actor: current_user).record!(employment_id: employment.id, facts:,
      expected_revision_digest: input[:expected_revision_digest], expected_preparation_id: input[:expected_preparation_id], idempotency_key: input[:idempotency_key], original_pdf: input[:original_pdf], reviewed: false)
    render json: { preparation: preparation_details(preparation) }, status: 201
  end

  def download
    stream_invoice(invoice_scope.find(invoice_id!(params[:id])))
  rescue ActiveStorage::FileNotFoundError, Payroll::Workflow::Conflict
    render json: { errors: "Private invoice document is unavailable" }, status: 404
  end

  def preparation_original
    stream_preparation_original(preparation_scope.find(invoice_id!(params[:preparation_id])))
  rescue ActiveStorage::FileNotFoundError, Payroll::Workflow::Conflict
    render json: { errors: "Private original invoice is unavailable" }, status: 404
  end

  private

    def own_employments
      Employment.kept.where(company_id: payroll_workspace_id, user_id: current_user.id)
    end

    def invoice_scope
      PayrollConsultantInvoice.where(company_id: payroll_workspace_id, employment_id: own_employments.select(:id))
    end

    def preparation_scope
      PayrollInvoicePreparation.where(company_id: payroll_workspace_id, employment_id: own_employments.select(:id))
    end

    def available_runs
      return [] unless Payroll::Entitlement.enabled?(payroll_workspace_id)

      ids = own_employments.pluck(:id)
      PayrollRun.where(company_id: payroll_workspace_id).order(period: :desc).limit(24).flat_map do |run|
        revision = run.payroll_revisions.order(number: :desc).first
        next [] unless revision && revision.payroll_approvals.where(stage: %w[accounts final]).distinct.count(:stage) == 2

        revision.payroll_payload.fetch("lines").filter_map do |line|
          next unless line["pay_type"] == "consultant" && ids.include?(line["employment_id"])
          employment = own_employments.find(line["employment_id"])
          preparation = preparation_scope.heads.find_by(payroll_run: run, employment:)
          next if invoice_scope.exists?(payroll_run: run, employment:)

          { id: run.id.to_s, employment_id: employment.id.to_s, period: run.period.strftime("%Y-%m"), revision_digest: revision.digest,
            legal_entity_name: employment.consultant_compensations.find(line.fetch("preparation").fetch("terms_id")).legal_entity_name,
            financial_year: Payroll::ConsultantInvoicePreparation.financial_year, preparation: preparation_details(preparation) }
        end
      end
    end
end
