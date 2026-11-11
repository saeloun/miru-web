# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Private consultant invoice API", type: :request do
  self.use_transactional_tests = false
  include_context "committed consultant invoice"
  let(:manager_path) { "/api/v1/payroll_runs/#{run.id}/consultant_invoices" }
  let(:own_path) { "/api/v1/consultant_invoices" }
  before do
    worker.update!(current_workspace: company)
    worker.add_role(:employee, company)
    sign_in accounts
  end

  def issued_invoice
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
  end

  def review_input(facts = invoice_facts)
    { employment_id: employment.id.to_s, facts:, expected_revision_digest: revision.digest,
      expected_preparation_id: "", idempotency_key: "http-review", reviewed: true }
  end

  context "with reviewed registered billing facts" do
    let(:billing_identity_ready) { false }
    before { review_synthetic_billing_identity(employment:, reviewer: owner, gst_scheme: "composition") }

    it "marks generation unsupported and rejects a direct reviewed generation request" do
      revision
      get manager_path, params: { company_id: company.id }
      expect(response).to have_http_status(:ok)
      row = response.parsed_body.dig("consultant_invoices", "consultants").sole
      expect(row).to include("generation_supported" => false, "can_review" => true)
      post "#{manager_path}/preparations", params: { company_id: company.id, invoice_preparation: review_input }, as: :json
      expect(response).to have_http_status(422)
      expect(response.parsed_body.fetch("errors")).to match(/existing invoice/i)
      expect(PayrollInvoicePreparation.count).to eq(0)
    end
  end

  it "shows scoped preparation facts and the fixed destination without choosing a mode for the reviewer" do
    revision
    get manager_path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    data = response.parsed_body.fetch("consultant_invoices")
    expect(data).to include("accounts_email" => "accounts@saeloun.com", "revision_digest" => revision.digest)
    row = data.fetch("consultants").sole
    expect(row).to include("employment_id" => employment.id.to_s, "can_review" => true, "preparation" => nil, "invoice" => nil)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
  end

  it "requires literal destination acknowledgement and rejects arbitrary recipient or actor fields" do
    post "#{manager_path}/preparations", params: { company_id: company.id, invoice_preparation: review_input(invoice_facts.merge("accounts_destination_confirmed" => false)) }, as: :json
    expect(response).to have_http_status(422)
    post "#{manager_path}/preparations", params: { company_id: company.id, invoice_preparation: review_input.merge(accounts_email: "other@example.com") }, as: :json
    expect(response).to have_http_status(422)
    post "#{manager_path}/preparations", params: { company_id: company.id, invoice_preparation: review_input }, as: :json
    expect(response).to have_http_status(:created)
    expect(PayrollInvoicePreparation.sole.facts.fetch("accounts_email")).to eq("accounts@saeloun.com")
    expect(PayrollConsultantInvoice.count).to eq(0)
  end

  it "allows assigned accounts to save an unreviewed preparation" do
    post "#{manager_path}/preparations", params: { company_id: company.id,
      invoice_preparation: review_input(invoice_facts.merge("accounts_destination_confirmed" => false)).merge(reviewed: false) }, as: :json
    expect(response).to have_http_status(:created)
    expect(PayrollInvoicePreparation.sole).not_to be_reviewed
  end

  it "exposes only invoice-scoped approved run discovery and draft configuration to an unassigned admin" do
    revision
    admin = create(:user, current_workspace: company)
    create(:employment, company:, user: admin, joined_at: "2020-01-01", resigned_at: nil)
    admin.add_role(:admin, company)
    sign_in admin
    get "/api/v1/payroll_consultant_invoice_runs", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("runs").sole).to include("id" => run.id.to_s, "period" => "2026-11", "can_configure" => true, "can_review_others" => false)
    expect(response.body).not_to include("bank_account", "source_account", "payroll_payload", "62500")
    get "/api/v1/payroll_runs/#{run.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    get manager_path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("consultant_invoices", "consultants").sole).to include("can_configure" => true, "can_review" => false)
    post "#{manager_path}/preparations", params: { company_id: company.id,
      invoice_preparation: review_input(invoice_facts.merge("accounts_destination_confirmed" => false)).merge(reviewed: false) }, as: :json
    expect(response).to have_http_status(:created)
    preparation = PayrollInvoicePreparation.sole
    post "#{manager_path}/preparations", params: { company_id: company.id,
      invoice_preparation: review_input.merge(expected_preparation_id: preparation.id.to_s, idempotency_key: "admin-proxy-review") }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "retains own private history and exact download bytes after withdrawal, exit and disabled payroll" do
    invoice = issued_invoice
    consent = Payroll::InvoiceAuthorization.new(employment, actor: worker)
    consent.record!(action: "withdraw", expected_event_id: consent.summary.dig(:current_event, :id), statement_digest: "", idempotency_key: "http-withdraw")
    employment.update!(resigned_at: "2026-12-04")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    sign_in worker
    get own_path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("invoices").sole).to include("id" => invoice.id.to_s, "status" => "Paid")
    get "#{own_path}/#{invoice.id}/download", params: { company_id: company.id, kind: "paid" }
    expect(response).to have_http_status(:ok)
    expect(response.body.b).to eq(invoice.pdf_blob.download)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
    expect(response.headers["Content-Disposition"]).to include("attachment")
  end

  it "denies another consultant and rechecks the active workspace after reading private bytes" do
    invoice = issued_invoice
    stranger = create(:user, current_workspace: company)
    create(:employment, company:, user: stranger, joined_at: "2020-01-01", resigned_at: nil)
    stranger.add_role(:employee, company)
    sign_in stranger
    get "#{own_path}/#{invoice.id}/download", params: { company_id: company.id, kind: "paid" }
    expect(response).to have_http_status(:not_found)
    sign_in worker
    allow(Payroll::ConsultantInvoiceDelivery).to receive(:pdf_bytes).and_wrap_original do |method, *arguments, **options|
      bytes = method.call(*arguments, **options)
      worker.update!(current_workspace: create(:company))
      bytes
    end
    get "#{own_path}/#{invoice.id}/download", params: { company_id: company.id, kind: "paid" }
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to start_with("%PDF")
  end

  it "denies cookie-authenticated writes without CSRF and rejects a stale workspace" do
    controller = Api::V1::PayrollConsultantInvoicesController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    post "#{manager_path}/preparations", params: { company_id: company.id, invoice_preparation: review_input }, as: :json
    expect(response).to have_http_status(422)
    expect(PayrollInvoicePreparation.count).to eq(0)
    controller.allow_forgery_protection = original
    sign_in accounts
    get manager_path, params: { company_id: company.id + 1 }
    expect(response).to have_http_status(:conflict)
  ensure
    controller.allow_forgery_protection = original if controller
  end

  it "never serves an invoice through anonymous signed storage redirect, proxy or disk URLs" do
    invoice = issued_invoice
    blob = invoice.pdf_blob
    paths = ["/rails/active_storage/blobs/redirect/#{blob.signed_id}/paid.pdf", "/rails/active_storage/blobs/proxy/#{blob.signed_id}/paid.pdf"]
    disk = ActiveStorage::Current.set(url_options: { host: "www.example.com", protocol: "http" }) { URI(blob.url).request_uri }
    paths << disk
    sign_out accounts
    aggregate_failures do
      paths.each do |path|
        get path
        expect(response).to have_http_status(:not_found)
        expect(response.body).not_to start_with("%PDF")
      end
    end
  end

  it "preserves ordinary noninvoice image redirect, proxy and disk downloads" do
    bytes = Base64.decode64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRz8AAAAASUVORK5CYII=")
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new(bytes), filename: "synthetic-logo.png", content_type: "image/png")
    sign_out accounts
    get "/rails/active_storage/blobs/redirect/#{blob.signed_id}/synthetic-logo.png"
    expect(response).to have_http_status(:found)
    get URI(response.location).request_uri
    expect(response).to have_http_status(:ok)
    expect(response.body.b).to eq(bytes)
    get "/rails/active_storage/blobs/proxy/#{blob.signed_id}/synthetic-logo.png"
    expect(response).to have_http_status(:ok)
    expect(response.body.b).to eq(bytes)
  end

  it "accepts only an unreviewed own original and lets accounts inspect its exact bytes before linking it" do
    revision
    facts = invoice_facts.merge("mode" => "existing", "timing" => "existing_invoice", "original_date" => "2026-11-30",
      "series" => "", "number" => "INV-2026-0042", "accounts_destination_confirmed" => false)
    original = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    sign_in worker
    command = review_input(facts).except(:reviewed).merge(payroll_run_id: run.id.to_s, original_pdf: original)
    post own_path, params: { company_id: company.id, invoice_preparation: command.merge(reviewed: true) }
    expect(response).to have_http_status(422)
    expect(PayrollInvoicePreparation.count).to eq(0)
    post own_path, params: { company_id: company.id, invoice_preparation: command.merge(facts: JSON.generate(facts)) }
    expect(response).to have_http_status(:created)
    submitted = PayrollInvoicePreparation.sole
    expect(submitted).not_to be_reviewed
    bytes = File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf"))
    get "#{own_path}/preparations/#{submitted.id}/original", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.body.b).to eq(bytes)
    sign_in accounts
    get "#{manager_path}/preparations/#{submitted.id}/original", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.body.b).to eq(bytes)
    post "#{manager_path}/preparations", params: { company_id: company.id,
      invoice_preparation: review_input(facts.merge("accounts_destination_confirmed" => true)).merge(expected_preparation_id: submitted.id.to_s, idempotency_key: "review-own-original") }, as: :json
    expect(response).to have_http_status(:created)
    reviewed = PayrollInvoicePreparation.heads.sole
    expect(reviewed.original_blob_id).to eq(submitted.original_blob_id)
    expect(reviewed).to be_reviewed
    expect(PayrollConsultantInvoice.count).to eq(0)
  ensure
    original&.tempfile&.close!
  end

  it "requires the latest uncertain delivery and explicit evidence before retrying the same immutable PDF" do
    invoice = issued_invoice
    attempt = invoice.payroll_consultant_invoice_deliveries.sole
    attempt.update!(state: "uncertain", error_code: "smtp_outcome_unknown")
    path = "#{manager_path}/#{invoice.id}"
    post "#{path}/retry_delivery", params: { company_id: company.id, invoice_delivery: { expected_attempt_id: attempt.id.to_s } }, as: :json
    expect(response).to have_http_status(:conflict)
    evidence = { reference: "Synthetic mailbox checked", worker_stopped: false }
    post "#{path}/reconcile_delivery", params: { company_id: company.id, invoice_delivery: { expected_attempt_id: attempt.id.to_s, outcome: "not_delivered", evidence: } }, as: :json
    expect(response).to have_http_status(:conflict)
    evidence[:worker_stopped] = true
    post "#{path}/reconcile_delivery", params: { company_id: company.id, invoice_delivery: { expected_attempt_id: (attempt.id + 1).to_s, outcome: "not_delivered", evidence: } }, as: :json
    expect(response).to have_http_status(:conflict)
    post "#{path}/reconcile_delivery", params: { company_id: company.id, invoice_delivery: { expected_attempt_id: attempt.id.to_s, outcome: "not_delivered", evidence: } }, as: :json
    expect(response).to have_http_status(:ok)
    post "#{path}/retry_delivery", params: { company_id: company.id, invoice_delivery: { expected_attempt_id: attempt.id.to_s, accounts_email: "other@example.com" } }, as: :json
    expect(response).to have_http_status(422)
    post "#{path}/retry_delivery", params: { company_id: company.id, invoice_delivery: { expected_attempt_id: attempt.id.to_s } }, as: :json
    expect(response).to have_http_status(:accepted)
    expect(invoice.payroll_consultant_invoice_deliveries.count).to eq(2)
    expect(PayrollConsultantInvoice.sole.id).to eq(invoice.id)
  end
end
