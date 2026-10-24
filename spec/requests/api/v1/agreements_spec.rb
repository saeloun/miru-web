# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Private agreement drafts", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:client) { create(:client, company:, legal_name: "Synthetic Legal & Partners") }
  let(:master) do
    AgreementTemplate.create!(company:, created_by: admin, title: "Client master", kind: "client",
      document: agreement_document, fields: agreement_fields)
  end

  before do
    admin.add_role(:owner, company)
    sign_in admin
  end

  def generate(**attributes)
    post "/api/v1/agreements", params: { agreement: { company_id: company.id,
      agreement_template_id: master.id, client_id: client.id, title: "Synthetic client contract", field_values: {}
    }.merge(attributes) }, as: :json
  end

  def create_draft(**attributes)
    master.build_agreement(created_by: admin, client:, title: "Synthetic client contract",
      field_values: { "legal_name" => "Original party" }, **attributes).tap(&:save!)
  end

  it "generates independent content and identity prefills with explicit admin overrides" do
    generate
    expect(response).to have_http_status(:created)
    item = response.parsed_body.fetch("agreement")
    expect(item).to include("status" => "draft", "document" => agreement_document,
      "field_values" => { "legal_name" => "Synthetic Legal & Partners" })
    generate(field_values: { legal_name: "Reviewed legal identity" })
    expect(response).to have_http_status(:created)
    expect(response.parsed_body.fetch("agreement").fetch("field_values")).to eq("legal_name" => "Reviewed legal identity")
    expect(master.reload.document).to eq(agreement_document)
  end

  it "allows an incomplete company address to remain a draft rather than crashing generation" do
    company.addresses.destroy_all
    generate
    expect(response).to have_http_status(:created)
    expect(response.parsed_body.fetch("agreement")).to include("status" => "draft")
  end

  it "allows independent clause edits and rejects stale saves without losing the newer draft" do
    record = create_draft
    patch "/api/v1/agreements/#{record.id}", params: { agreement: { company_id: company.id, lock_version: 0,
      document: agreement_document("Negotiated & <private> clause") } }, as: :json
    expect(response).to have_http_status(:ok)
    patch "/api/v1/agreements/#{record.id}", params: { agreement: { company_id: company.id, lock_version: 0,
      document: agreement_document("Stale copy") } }, as: :json
    expect(response).to have_http_status(:conflict)
    get "/api/v1/agreements/#{record.id}"
    expect(response.parsed_body.fetch("agreement").fetch("document")).to eq(agreement_document("Negotiated & <private> clause"))
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(record.reload.audits.where(action: "update")).to exist
    expect(record.audits.pluck(:audited_changes).to_json).not_to include("Negotiated", "Original party")
  end

  it "does not permit a draft update to change its party, creator, source or signing state" do
    record = create_draft
    patch "/api/v1/agreements/#{record.id}", params: { agreement: { company_id: company.id, lock_version: 0,
      status: "signed", client_id: create(:client, company:).id, created_by_id: create(:user).id,
      agreement_template_id: nil, source_template_version: 999, title: "Still a draft" } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(record.reload).to have_attributes(status: "draft", client_id: client.id, created_by_id: admin.id,
      agreement_template_id: master.id, source_template_version: 0)
  end

  it "rejects cross-company templates/parties and stale-workspace generation" do
    generate(client_id: create(:client).id)
    expect(response).to have_http_status(:not_found)
    other_master = AgreementTemplate.create!(company: create(:company), created_by: admin, title: "Other", kind: "client",
      document: agreement_document, fields: agreement_fields)
    generate(agreement_template_id: other_master.id)
    expect(response).to have_http_status(:not_found)
    generate(company_id: other_master.company_id)
    expect(response).to have_http_status(:conflict)
    expect(Agreement.count).to eq(0)
  end

  it "generates a pre-joining consultant copy with explicit compensation and no payroll mutation" do
    consultant = create(:employment, company:, resigned_at: nil)
    consultant.update_column(:joined_at, Date.tomorrow)
    address = consultant.user.addresses.find_by(address_type: "current") || create(:address, addressable: consultant.user, address_type: "current")
    fields = agreement_fields + [{ "key" => "compensation_amount", "label" => "Fee", "type" => "number",
      "role" => "admin", "required" => true, "read_only" => true }] + [
      ["compensation_currency", "text"], ["compensation_frequency", "text"], ["consultant_address", "text"], ["joined_on", "date"]
    ].map do |key, type|
      agreement_fields.first.merge("key" => key, "label" => key.humanize, "type" => type)
    end
    consultant_master = AgreementTemplate.create!(company:, created_by: admin, kind: "consultant", title: "Consultant master",
      document: agreement_document, fields:)
    generate(agreement_template_id: consultant_master.id, client_id: nil, employment_id: consultant.id,
      field_values: { legal_name: "Verified consultant legal name", compensation_amount: "12345.50",
        compensation_currency: "INR", compensation_frequency: "monthly" })
    expect(response).to have_http_status(:created)
    expect(response.parsed_body.fetch("agreement")).to include("employment_id" => consultant.id, "kind" => "consultant",
      "field_values" => { "legal_name" => "Verified consultant legal name", "compensation_amount" => "12345.50",
        "compensation_currency" => "INR", "compensation_frequency" => "monthly",
        "consultant_address" => address.formatted_address, "joined_on" => Date.tomorrow.iso8601 })
    expect(consultant.reload.employee_record).to be_nil
  end

  it "lists metadata only and never exposes another company's agreements" do
    record = create_draft
    other_master = AgreementTemplate.create!(company: create(:company), created_by: admin, title: "Other", kind: "client",
      document: agreement_document, fields: agreement_fields)
    other = other_master.build_agreement(created_by: admin, client: create(:client, company: other_master.company), title: "Private other")
    other.save!
    get "/api/v1/agreements"
    expect(response).to have_http_status(:ok)
    items = response.parsed_body.fetch("agreements")
    expect(items.map { |item| item.fetch("id") }).to eq([record.id])
    expect(items.first.keys & %w[document fields field_values]).to be_empty
    get "/api/v1/agreements/#{other.id}"
    expect(response).to have_http_status(:not_found)
  end

  it "does not fetch confidential content and field values when listing drafts" do
    create_draft
    queries = []
    listener = ->(*args) { queries << args.last[:sql] if args.last[:sql].include?('FROM "agreements"') }
    ActiveSupport::Notifications.subscribed(listener, "sql.active_record") { get "/api/v1/agreements" }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("agreements").size).to eq(1)
    expect(queries.join).not_to match(/"agreements"\.\*|"document"|"fields"|"field_values"/)
  end

  it "provides bounded company-scoped party search for generating drafts" do
    client.update!(legal_name: "Findable Legal Company")
    create(:client, legal_name: "Findable other workspace")
    get "/api/v1/agreements/parties", params: { kind: "client", query: "Findable" }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("parties")).to eq([{ "id" => client.id, "name" => "Findable Legal Company", "email" => client.email }])
    consultant = create(:employment, company:, resigned_at: nil)
    consultant.user.update!(first_name: "Uniqueconsultant", last_name: "Person")
    ["Uniqueconsultant Person", consultant.user.email, consultant.employee_id].each do |query|
      get "/api/v1/agreements/parties", params: { kind: "consultant", query: }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch("parties")).to include(hash_including("id" => consultant.id, "name" => "Uniqueconsultant Person"))
    end
    get "/api/v1/agreements/parties", params: { kind: "bank", query: "Findable" }
    expect(response).to have_http_status(:bad_request)
    get "/api/v1/agreements/parties", params: { kind: "client", query: "x" * 101 }
    expect(response).to have_http_status(:bad_request)
    admin.remove_role(:owner, company)
    admin.add_role(:employee, company)
    get "/api/v1/agreements/parties", params: { kind: "client" }
    expect(response).to have_http_status(:forbidden)
  end

  it "rejects invalid field values without altering the persisted contract" do
    record = create_draft
    patch "/api/v1/agreements/#{record.id}", params: { agreement: { company_id: company.id, lock_version: 0,
      field_values: { legal_name: { html: "<script>" } } } }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(record.reload.field_values).to eq("legal_name" => "Original party")
  end

  it "rejects a malformed draft root without attempting an assignment" do
    post "/api/v1/agreements", params: { agreement: "invalid" }, as: :json
    expect(response).to have_http_status(:bad_request)
    expect(Agreement.count).to eq(0)
  end

  it "denies an employee or bookkeeper reads, exports and draft generation" do
    record = create_draft
    admin.remove_role(:owner, company)
    %w[employee book_keeper].each do |role|
      admin.add_role(role, company)
      get "/api/v1/agreements/#{record.id}"
      expect(response).to have_http_status(:forbidden)
      get "/api/v1/agreements/#{record.id}/download"
      expect(response).to have_http_status(:forbidden)
      generate
      expect(response).to have_http_status(:forbidden)
      admin.remove_role(role, company)
    end
  end

  it "exports the actual persisted contract as a private DRAFT PDF and records a metadata-only download audit" do
    allow(Ferrum::Browser).to receive(:new).and_call_original
    record = create_draft
    get "/api/v1/agreements/#{record.id}/download"
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("application/pdf")
    expect(response.body.b).to start_with("%PDF-".b)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
    expect(response.body.bytesize).to be > 1000
    expect(response.body).to include("%%EOF")
    expect(record.audits.where(action: "download")).to exist
  end
end
