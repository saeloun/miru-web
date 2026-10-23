# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Agreement template authoring", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }

  before do
    admin.add_role(:admin, company)
    sign_in admin
  end

  def master(**attributes)
    AgreementTemplate.create!({ company:, created_by: admin, title: "Synthetic master", kind: "client",
      document: agreement_document, fields: agreement_fields }.merge(attributes))
  end

  def create_master(**attributes)
    post "/api/v1/agreement_templates", params: { agreement_template: {
      company_id: company.id, title: "Synthetic master", kind: "client", document: agreement_document,
      fields: agreement_fields
    }.merge(attributes) }, as: :json
  end

  it "creates, reads and edits the full master while retaining private cache headers and edit audit metadata" do
    create_master
    expect(response).to have_http_status(:created)
    item = response.parsed_body.fetch("agreement_template")
    expect(item).to include("document" => agreement_document, "fields" => agreement_fields, "lock_version" => 0)
    id = item.fetch("id")
    patch "/api/v1/agreement_templates/#{id}", params: { agreement_template: {
      company_id: company.id, lock_version: 0, document: agreement_document("Changed confidential clause")
    } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("agreement_template")).to include("lock_version" => 1)
    get "/api/v1/agreement_templates/#{id}"
    expect(response).to have_http_status(:ok)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    record = AgreementTemplate.find(id)
    expect(record.audits.where(action: "update")).to exist
    expect(record.audits.pluck(:audited_changes).to_json).not_to include("Changed confidential clause", "Consulting terms")
  end

  it "lists newest masters with pagination and excludes document/field payloads from archive responses" do
    31.times { |index| master(title: "Template #{index}") }
    get "/api/v1/agreement_templates"
    expect(response).to have_http_status(:ok)
    items = response.parsed_body.fetch("agreement_templates")
    expect(items.length).to eq(30)
    expect(items.first.fetch("title")).to eq("Template 30")
    expect(items.first.keys & %w[document fields]).to be_empty
    expect(response.parsed_body.fetch("pagination")).to include("page" => 1, "pages" => 2)
    get "/api/v1/agreement_templates", params: { page: 2 }
    expect(response.parsed_body.fetch("agreement_templates").length).to eq(1)
    get "/api/v1/agreement_templates", params: { page: "nonsense" }
    expect(response).to have_http_status(:bad_request)
  end

  it "rejects malformed documents/fields without creating any master" do
    create_master(document: { type: "script", text: "alert(1)" })
    expect(response).to have_http_status(:unprocessable_content)
    expect(AgreementTemplate.count).to eq(0)
    create_master(fields: { forged: true })
    expect(response).to have_http_status(:unprocessable_content)
    expect(AgreementTemplate.count).to eq(0)
  end

  it "requires the original company and an exact non-coerced version on every update" do
    record = master
    [nil, "bad", -1, 0.5, 1].each do |version|
      patch "/api/v1/agreement_templates/#{record.id}", params: { agreement_template: {
        company_id: company.id, lock_version: version, title: "Lost update"
      } }, as: :json
      expect(response).to have_http_status(:conflict)
    end
    create_master(company_id: create(:company).id)
    expect(response).to have_http_status(:conflict)
    expect(record.reload.title).to eq("Synthetic master")
  end

  it "returns 404 for another company's master even when its ID is known" do
    record = master(company: create(:company))
    get "/api/v1/agreement_templates/#{record.id}"
    expect(response).to have_http_status(:not_found)
    patch "/api/v1/agreement_templates/#{record.id}", params: { agreement_template: {
      company_id: company.id, lock_version: 0, title: "Stolen master"
    } }, as: :json
    expect(response).to have_http_status(:not_found)
  end

  %w[employee book_keeper client manager].each do |role|
    it "denies #{role} access to confidential template content and mutations" do
      record = master
      admin.remove_role(:admin, company)
      admin.add_role(role, company)
      get "/api/v1/agreement_templates/#{record.id}"
      expect(response).to have_http_status(:forbidden)
      create_master
      expect(response).to have_http_status(:forbidden)
      expect(AgreementTemplate.count).to eq(1)
    end
  end

  it "denies departed/discarded/future staff and unauthenticated callers" do
    membership.update_column(:resigned_at, Date.yesterday)
    get "/api/v1/agreement_templates"
    expect(response).to have_http_status(:forbidden)
    membership.update_columns(resigned_at: nil, joined_at: Date.tomorrow)
    sign_in admin
    get "/api/v1/agreement_templates"
    expect(response).to have_http_status(:forbidden)
    membership.update_columns(joined_at: Date.yesterday, discarded_at: Time.current)
    sign_in admin
    get "/api/v1/agreement_templates", as: :json
    expect(response).to have_http_status(:unauthorized)
    sign_out admin
    get "/api/v1/agreement_templates"
    expect(response).to have_http_status(:unauthorized)
  end

  it "protects cookie-authenticated authoring against CSRF" do
    controller = Api::V1::AgreementTemplatesController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    create_master
    expect(response).to have_http_status(:unprocessable_content)
    expect(AgreementTemplate.count).to eq(0)
  ensure
    controller.allow_forgery_protection = original if controller
  end

  it "filters contract bodies, values and imported documents from request logs" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    result = filter.filter("agreement_template" => { "document" => "Private terms" },
      "agreement" => { "field_values" => { "fee" => "98765.43" } })
    expect(result.to_json).not_to include("Private terms", "98765.43")
  end
end
