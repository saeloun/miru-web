# frozen_string_literal: true

require "rails_helper"

RSpec.describe ConsultantInvoiceAuthorization do
  include_context "approved mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  let(:service) { Payroll::InvoiceAuthorization.new(employment, actor: worker) }
  before do
    worker.update!(current_workspace: company)
    employment.update!(joined_at: "2020-01-01")
  end

  def grant
    result = service.record!(action: "grant", expected_event_id: "", statement_digest: service.summary.dig(:statement, :digest), idempotency_key: "grant")
    described_class.find(result.dig(:current_event, :id))
  end

  def raw_insert(attributes)
    ApplicationRecord.transaction(requires_new: true) { described_class.insert_all!([attributes]) }
  end

  it "rejects SQL updates and deletes while retaining its exact granted statement" do
    row = grant
    %w[UPDATE DELETE].each do |operation|
      sql = operation == "UPDATE" ? "UPDATE consultant_invoice_authorizations SET statement_text='changed' WHERE id=#{row.id}" :
        "DELETE FROM consultant_invoice_authorizations WHERE id=#{row.id}"
      expect { ApplicationRecord.transaction(requires_new: true) { described_class.connection.execute(sql) } }
        .to raise_error(ActiveRecord::StatementInvalid, /immutable/)
    end
    expect(row.reload.statement_text).to eq(Payroll::InvoiceAuthorization::STATEMENT_TEXT)
  end

  it "rejects proxy actors, foreign tenants and altered withdrawal evidence outside callbacks" do
    row = grant
    base = row.attributes.except("id").merge("previous_event_id" => row.id, "action" => "withdraw", "idempotency_key" => "raw-withdraw")
    [{ "actor_id" => owner.id }, { "company_id" => create(:company).id }, { "employment_id" => create(:employment).id }].each do |substitution|
      expect { raw_insert(base.merge(substitution)) }.to raise_error(ActiveRecord::StatementInvalid)
    end
    expect { raw_insert(base.merge("statement_text" => "Unaccepted replacement wording")) }
      .to raise_error(ActiveRecord::StatementInvalid, /retain the granted statement/)
    expect(described_class.count).to eq(1)
  end

  it "rejects stale successors and duplicate roots even through direct inserts" do
    row = grant
    service.record!(action: "withdraw", expected_event_id: row.id.to_s, statement_digest: "", idempotency_key: "withdraw")
    attributes = row.attributes.except("id").merge("previous_event_id" => row.id, "action" => "withdraw", "idempotency_key" => "stale-successor")
    expect { raw_insert(attributes) }.to raise_error(ActiveRecord::StatementInvalid, /predecessor changed/)
    expect { raw_insert(row.attributes.except("id").merge("idempotency_key" => "second-root")) }
      .to raise_error(ActiveRecord::StatementInvalid, /predecessor changed/)
    expect(described_class.count).to eq(2)
  end

  it "refuses destructive rollback after adoption" do
    row = grant
    require Rails.root.join("db/migrate/20261109130000_create_consultant_invoice_authorizations")
    expect { CreateConsultantInvoiceAuthorizations.new.down }.to raise_error(ActiveRecord::IrreversibleMigration)
    expect(row.reload.statement_digest).to eq(service.summary.dig(:statement, :digest))
  end
end
