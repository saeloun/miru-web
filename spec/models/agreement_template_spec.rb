# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Agreement template copies" do
  let(:company) { create(:company) }
  let(:admin) { create(:user) }
  let(:client) { create(:client, company:) }

  def template
    AgreementTemplate.create!(company:, created_by: admin, title: "Master service agreement", kind: "client",
      document: agreement_document, fields: agreement_fields)
  end

  it "generates an independent editable copy without mutating the master or later client facts" do
    master = template
    draft = master.build_agreement(created_by: admin, client:, title: "October engagement",
      field_values: { "legal_name" => "Original Legal & Co" })
    draft.save!
    expect(draft.source_template_version).to eq(0)
    draft.document["content"][0]["content"][0]["text"] = "Negotiated clause"
    draft.save!
    master.update!(document: agreement_document("New master clause"))
    client.update!(legal_name: "Changed Legal & Co")
    expect(draft.reload.document["content"][0]["content"][0]["text"]).to eq("Negotiated clause")
    expect(draft.field_values["legal_name"]).to eq("Original Legal & Co")
    expect(master.reload.document["content"][0]["content"][0]["text"]).to eq("New master clause")
  end

  it "does not share mutable field definitions with a generated copy" do
    master = template
    draft = master.build_agreement(created_by: admin, client:, title: "Draft")
    draft.fields.first["label"] = "Negotiated party name"
    expect(master.fields.first["label"]).to eq("Legal name")
    expect(master.document).to eq(agreement_document)
  end

  it "saves a master without custom fields and copies empty values without sharing defaults" do
    master = AgreementTemplate.create!(company:, created_by: admin, title: "Free text master", kind: "client",
      document: { "type" => "doc", "content" => [{ "type" => "paragraph" }] }, fields: [])
    draft = master.build_agreement(created_by: admin, client:, title: "Independent free text")
    draft.save!
    expect(master.reload.fields).to eq([])
    expect(draft.reload.field_values).to eq({})
  end

  it "rejects invalid document/field content and changes of template company/kind" do
    master = template
    expect(master.update(document: { "type" => "script" })).to be(false)
    master.reload
    expect(master.update(company: create(:company))).to be(false)
    master.reload
    expect(master.update(kind: "consultant")).to be(false)
  end

  it "encrypts the master and custom fields and keeps audit content metadata-only" do
    master = template
    raw = AgreementTemplate.connection.select_one("SELECT document, fields FROM agreement_templates WHERE id = #{master.id}")
    expect(raw.values.join).not_to include("Consulting terms", "Legal name")
    expect(master.reload.document).to eq(agreement_document)
    expect(master.audits.last.audited_changes.keys).to match_array(%w[company_id created_by_id kind updated_at])
  end

  it "keeps the previous master when a stale editor tries to save" do
    master = template
    stale = AgreementTemplate.find(master.id)
    master.update!(title: "Saved newer title")
    expect { stale.update!(title: "Stale title") }.to raise_error(ActiveRecord::StaleObjectError)
    expect(master.reload.title).to eq("Saved newer title")
  end

  it "prevents deleting a master referenced by an agreement" do
    master = template
    master.build_agreement(created_by: admin, client:, title: "Retained draft").save!
    expect { master.destroy! }.to raise_error(ActiveRecord::DeleteRestrictionError)
  end
end
