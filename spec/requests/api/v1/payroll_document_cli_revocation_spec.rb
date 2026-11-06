# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payroll document CLI revocation", type: :request do
  let(:company) { create(:company, base_currency: "INR") }
  let(:actor) { create(:user, current_workspace: company) }
  let(:employment) { create(:employment, company:, user: actor, joined_at: Date.new(2020, 1, 1), resigned_at: nil) }

  before do
    # Exercise the request's commit boundary without the suite's enclosing transaction.
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
    actor.add_role(:admin, company)
    employment
  end

  def private_document(kind)
    record = case kind
             when "salary_slip"
               employment.salary_slips.new(uploaded_by: actor, pay_month: Date.new(2026, 9, 1), source: "Synthetic approved provider")
             when "employee_document"
               employment.employee_documents.new(kind: "pan", uploaded_by: actor)
             else
               employment.tax_declarations.new(tax_year: 2026, category: "investment", claimed_amount: "1000.00")
    end
    file = { io: StringIO.new(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf"))),
             filename: "synthetic-payroll.pdf", content_type: "application/pdf" }
    kind == "tax_evidence" ? record.evidence.attach(file) : record.file.attach(file)
    record.save!
    case kind
    when "salary_slip"
      record.publish!(actor:)
      [record, "/api/v1/salary_slips/#{record.id}/download"]
    when "employee_document"
      [record, "/api/v1/employee_records/documents/#{record.id}?kind=pan"]
    else
      [record, "/api/v1/tax_declarations/#{record.id}/evidence/#{record.evidence.first.id}"]
    end
  end

  it "permanently revokes a CLI session invalidated while a private employee CSV is generated" do
    account = "9876543210987654"
    EmployeeRecord.create!(employment:, private_details: { "bank_account_number" => account })
    report = EmployeeReport.create!(company:, name: "Synthetic private report", columns: ["bank_account_number"])
    session, token = CliSession.issue_for(user: actor, company:)
    allow_any_instance_of(EmployeeReports::DownloadService).to receive(:process).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |csv|
        expect(csv).to include(account)
        actor.remove_role(:admin, company)
      end
    end

    get "/api/v1/employee_reports/#{report.id}/download", params: { month: "2026-10" }, headers: { "Authorization" => "Bearer #{token}" }

    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include(account)
    expect(report.audits.where(action: "download")).to be_empty
    expect(session.reload.revoked_at).to be_present
    actor.add_role(:admin, company)
    expect(CliSession.authenticate(token)).to be_nil
  end

  %w[salary_slip tax_evidence employee_document].each do |kind|
    it "permanently revokes a CLI session invalidated during #{kind} storage download" do
      record, path = private_document(kind)
      session, token = CliSession.issue_for(user: actor, company:)
      allow_any_instance_of(ActiveStorage::Blob).to receive(:download).and_wrap_original do |original, *arguments|
        original.call(*arguments).tap { actor.remove_role(:admin, company) }
      end

      get path, headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:forbidden)
      expect(response.body).not_to include("%PDF")
      expect(record.audits.where(action: "download")).to be_empty
      expect(session.reload.revoked_at).to be_present

      actor.add_role(:admin, company)
      expect(CliSession.authenticate(token)).to be_nil
    end
  end
end
