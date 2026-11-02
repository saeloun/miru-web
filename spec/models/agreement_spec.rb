# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Agreement draft storage" do
  let(:company) { create(:company) }
  let(:admin) { create(:user) }
  let(:client) { create(:client, company:) }

  def draft(**attributes)
    Agreement.new({ company:, created_by: admin, client:, kind: "client", title: "Consulting engagement",
      document: agreement_document, fields: agreement_fields, field_values: { "legal_name" => "Confidential Legal Name" }
    }.merge(attributes))
  end

  it "saves an encrypted draft with metadata-only audit and no implied signature/approval" do
    record = draft
    record.save!
    expect(record.status).to eq("draft")
    raw = Agreement.connection.select_one("SELECT document, fields, field_values FROM agreements WHERE id = #{record.id}")
    expect(raw.values.join).not_to include("Consulting terms", "Legal name", "Confidential Legal Name")
    expect(record.reload.field_values).to eq("legal_name" => "Confidential Legal Name")
    expect(record.audits.last.audited_changes.keys).to match_array(%w[company_id created_by_id client_id employment_id kind status updated_at])
    expect(record.update(status: "signed")).to be(false)
  end

  it "accepts a consultant employment, including before joining, without changing payroll facts" do
    employment = create(:employment, company:, resigned_at: nil)
    # Before-join agreement authoring must not depend on active payroll eligibility.
    employment.update_column(:joined_at, 1.month.from_now.to_date)
    record = draft(kind: "consultant", client: nil, employment:)
    expect(record.save).to be(true)
    expect(employment.reload.employee_record).to be_nil
  end

  it "rejects absent, mixed, wrong-kind and cross-company counterparties" do
    other_client = create(:client)
    employment = create(:employment, company:)
    [draft(client: nil), draft(employment:), draft(kind: "consultant"), draft(client: other_client),
      draft(kind: "consultant", client: nil, employment: create(:employment))].each do |record|
      expect(record).not_to be_valid
    end
  end

  it "rejects a template from another company or agreement kind" do
    source = AgreementTemplate.create!(company: create(:company), created_by: admin,
      title: "Other master", kind: "consultant", document: agreement_document, fields: agreement_fields)
    expect(draft(agreement_template: source, source_template_version: 0)).not_to be_valid
  end

  it "validates the body and typed field values on every save" do
    record = draft
    record.save!
    expect(record.update(field_values: { "legal_name" => { "html" => "<script>" } })).to be(false)
    expect(record.reload.field_values).to eq("legal_name" => "Confidential Legal Name")
    expect(record.update(document: { "type" => "doc", "content" => [{ "type" => "script" }] })).to be(false)
  end

  it "rejects stale writes and party changes without losing a saved clause" do
    record = draft
    record.save!
    stale = Agreement.find(record.id)
    record.update!(document: agreement_document("Saved clause"))
    expect { stale.update!(document: agreement_document("Stale clause")) }.to raise_error(ActiveRecord::StaleObjectError)
    expect(record.reload.document["content"].first["content"].first["text"]).to eq("Saved clause")
    expect(record.update(client: create(:client, company:))).to be(false)
    expect(record.update(company: create(:company))).to be(false)
  end

  it "restricts deleting a referenced client instead of cascading away the contract" do
    record = draft
    record.save!
    expect { Agreement.transaction(requires_new: true) { client.delete } }.to raise_error(ActiveRecord::InvalidForeignKey)
    expect(record.reload).to be_persisted
  end

  it "persists empty encrypted field definitions and values for a fully editable free-text contract" do
    record = draft(document: { "type" => "doc", "content" => [{ "type" => "paragraph" }] }, fields: [], field_values: {})
    record.save!
    expect(record.reload.fields).to eq([])
    expect(record.field_values).to eq({})
  end

  it "enforces the copied template version in the database even when model validations are bypassed" do
    source = AgreementTemplate.create!(company:, created_by: admin, title: "Master", kind: "client",
      document: agreement_document, fields: agreement_fields)
    record = source.build_agreement(created_by: admin, client:, title: "Draft", field_values: { "legal_name" => "Party" })
    record.save!
    expect do
      Agreement.transaction(requires_new: true) { record.update_column(:source_template_version, nil) }
    end.to raise_error(ActiveRecord::StatementInvalid, /agreements_source_version/)
  end
end
