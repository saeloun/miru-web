# frozen_string_literal: true

class Api::V1::PayrollConsultantInvoicesController < Api::V1::PayrollBaseController
  include ConsultantInvoiceAccess
  before_action :invoice_run, except: :runs
  PREPARATION_FIELDS = %w[employment_id facts expected_revision_digest expected_preparation_id idempotency_key original_pdf reviewed].freeze

  rescue_from ActionController::ParameterMissing, ActionController::BadRequest do
    render json: { errors: "Provide complete named invoice parameters" }, status: 422
  end

  def runs
    authorize current_company, :runs?, policy_class: PayrollConsultantInvoicePolicy
    approved = PayrollRevision.joins(:payroll_approvals)
      .where("payroll_revisions.number=(SELECT MAX(r.number) FROM payroll_revisions r WHERE r.payroll_run_id=payroll_revisions.payroll_run_id)")
      .group("payroll_revisions.id").having("COUNT(DISTINCT payroll_approvals.stage)=2").select(:payroll_run_id)
    company_runs = PayrollRun.where(company_id: payroll_workspace_id)
    issued = PayrollConsultantInvoice.where(company_id: payroll_workspace_id).select(:payroll_run_id)
    scope = company_runs.where(id: approved).or(company_runs.where(id: issued))
    admin = current_user.roles.where(resource: current_company, name: %w[owner admin]).exists?
    scope = scope.where(accounts_reviewer_id: current_user.id) unless admin
    pages = [(scope.count / 24.0).ceil, 1].max
    page = [invoice_id!(params[:page] || "1"), pages].min
    rows = scope.order(period: :desc, id: :desc).limit(24).offset((page - 1) * 24).filter_map do |run|
      next unless invoice_policy(run).index?
      approved_revision = Payroll::ConsultantInvoiceIssue.revision_intact?(run, run.current_revision)
      next unless approved_revision || PayrollConsultantInvoice.exists?(company_id: payroll_workspace_id, payroll_run: run)
      { id: run.id.to_s, period: run.period.strftime("%Y-%m"), can_configure: approved_revision,
        can_review_others: run.accounts_reviewer_id == current_user.id || current_user.roles.where(resource: current_company, name: "owner").exists? }
    end
    render json: { runs: rows, page:, has_more: page < pages }
  end

  def index
    authorize @run, :index?, policy_class: PayrollConsultantInvoicePolicy
    revision = @run.current_revision
    approved_revision = Payroll::ConsultantInvoiceIssue.revision_intact?(@run, revision)
    rows = if approved_revision
      approved_rows(revision)
    else
      issued_snapshot_rows
    end
    if !approved_revision && rows.empty?
      raise Payroll::Workflow::NotAuthorized, "Invoice preparation waits for payroll approval"
    end

    render json: { consultant_invoices: { company_id: @run.company_id.to_s, run_id: @run.id.to_s, revision_digest: approved_revision ? revision.digest : nil,
      accounts_email: Payroll::ConsultantInvoicePreparation::ACCOUNTS_EMAIL, issue_date: Time.current.in_time_zone("Asia/Kolkata").to_date.iso8601,
      financial_year: Payroll::ConsultantInvoicePreparation.financial_year, consultants: rows } }
  end

  def preparations
    input = invoice_input!(:invoice_preparation, PREPARATION_FIELDS)
    employment = @run.company.employments.kept.find(invoice_id!(input[:employment_id]))
    context = invoice_context(@run, employment)
    reviewed = invoice_boolean!(input[:reviewed])
    authorize context, reviewed ? :review? : :configure?, policy_class: PayrollConsultantInvoicePolicy
    preparation = Payroll::ConsultantInvoicePreparation.new(@run, actor: current_user).record!(employment_id: employment.id,
      facts: invoice_facts!(input[:facts]), expected_revision_digest: input[:expected_revision_digest], expected_preparation_id: input[:expected_preparation_id],
      idempotency_key: input[:idempotency_key], original_pdf: input[:original_pdf], reviewed:)
    render json: { preparation: preparation_details(preparation) }, status: 201
  end

  def retry_generation
    input = invoice_input!(:invoice_retry, %w[employment_id expected_preparation_id])
    employment = @run.company.employments.kept.find(invoice_id!(input[:employment_id]))
    context = invoice_context(@run, employment)
    authorize context, :review?, policy_class: PayrollConsultantInvoicePolicy
    @run.with_lock do
      employment.with_lock do
        authorize context, :review?, policy_class: PayrollConsultantInvoicePolicy
        preparation = preparation_scope.heads.lock.find_by!(employment:)
        unless preparation.id.to_s == input[:expected_preparation_id] && %w[failed blocked waiting_credit].include?(preparation.state)
          raise Payroll::Workflow::Conflict, "Invoice generation state changed; reload before retrying"
        end
        preparation.update!(state: "queued", claim_token: nil, started_at: nil, error_code: nil, next_attempt_at: Time.current)
      end
    end
    PayrollConsultantInvoiceIssueJob.enqueue_safely(@run.id, employment.id)
    render json: { queued: true }, status: 202
  end

  def retry_delivery
    invoice = invoice_scope.find(invoice_id!(params[:id]))
    authorize invoice, :review?, policy_class: PayrollConsultantInvoicePolicy
    input = invoice_input!(:invoice_delivery, %w[expected_attempt_id])
    attempt = invoice.payroll_consultant_invoice_deliveries.order(attempt_number: :desc).first!
    saved = Payroll::ConsultantInvoiceDelivery.new(attempt).retry!(actor: current_user, expected_attempt_id: input[:expected_attempt_id])
    render json: { attempt_id: saved.id.to_s, state: saved.state }, status: 202
  end

  def reconcile_delivery
    invoice = invoice_scope.find(invoice_id!(params[:id]))
    authorize invoice, :review?, policy_class: PayrollConsultantInvoicePolicy
    input = invoice_input!(:invoice_delivery, %w[expected_attempt_id outcome evidence])
    attempt = invoice.payroll_consultant_invoice_deliveries.order(attempt_number: :desc).first!
    raise Payroll::Workflow::Conflict, "Delivery attempt changed" unless attempt.id.to_s == input[:expected_attempt_id]
    evidence = input[:evidence].is_a?(ActionController::Parameters) ? input[:evidence].to_unsafe_h : input[:evidence]
    Payroll::ConsultantInvoiceDelivery.new(attempt).reconcile!(actor: current_user, outcome: input[:outcome], evidence:)
    render json: { invoice: invoice_details(invoice.reload) }
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

    def approved_rows(revision)
      revision.payroll_payload.fetch("lines").filter_map do |line|
        next unless line["pay_type"] == "consultant"
        employment = @run.company.employments.kept.find_by(id: line["employment_id"])
        next unless employment
        context = invoice_context(@run, employment)
        preparation = preparation_scope.heads.find_by(employment:)
        invoice = invoice_scope.find_by(employment:)
        binding = line.dig("preparation", "billing_identity")
        binding ||= Payroll::BillingIdentity.new(employment).binding
        billing = Payroll::BillingIdentity.new(employment).frozen_binding!(binding) if binding
        { employment_id: employment.id.to_s, consultant_name: employment.user.full_name,
          legal_entity_name: employment.consultant_compensations.find(line.fetch("preparation").fetch("terms_id")).legal_entity_name,
          billing_identity: billing, supplemental_billing_binding: line.dig("preparation", "billing_identity") ? nil : binding,
          generation_supported: Payroll::ConsultantInvoicePreparation.generation_supported?(billing),
          amounts: line.fetch("amounts").transform_values(&:to_s), preparation: preparation_details(preparation), invoice: invoice && invoice_details(invoice),
          can_configure: invoice_policy(context).configure?, can_review: invoice_policy(context).review? }
      end
    end

    def issued_snapshot_rows
      invoice_scope.order(:id).filter_map do |invoice|
        next unless Payroll::ConsultantInvoiceIssue.revision_intact?(@run, invoice.payroll_revision)

        details = invoice_details(invoice)
        { employment_id: invoice.employment_id.to_s, consultant_name: details.fetch(:consultant_name),
          legal_entity_name: invoice.snapshot.dig("billed_entity", "name"), billing_identity: nil, supplemental_billing_binding: nil,
          generation_supported: false, amounts: {}, preparation: nil, invoice: details,
          can_configure: false, can_review: invoice_policy(invoice).review? }
      end
    end

    def invoice_run
      @run = PayrollRun.where(company_id: payroll_workspace_id).find(invoice_id!(params[:payroll_run_id]))
    end

    def invoice_scope
      PayrollConsultantInvoice.where(company_id: @run.company_id, payroll_run: @run)
    end

    def preparation_scope
      PayrollInvoicePreparation.where(company_id: @run.company_id, payroll_run: @run)
    end
end
