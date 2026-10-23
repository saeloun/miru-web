# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Employee records", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let!(:admin_employment) { create(:employment, company:, user: admin, resigned_at: nil) }
  let!(:employment) { create(:employment, company:, user: employee, resigned_at: nil) }

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(nil)
    admin.add_role(:admin, company)
    employee.add_role(:employee, company)
    sign_in admin
  end

  def update_record(details, **attributes)
    patch "/api/v1/employee_records", params: {
      employee_record: { company_id: company.id, user_id: employee.id, private_details: details }.merge(attributes)
    }, as: :json
  end

  def upload_document(kind: "pan", file: nil, **attributes)
    file ||= Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    post "/api/v1/employee_records/documents", params: {
      employee_document: { company_id: company.id, user_id: employee.id, kind:, file: }.merge(attributes)
    }
  end

  def record_payment(**attributes)
    post "/api/v1/employee_records/payments", params: {
      employee_payment: { company_id: company.id, user_id: employee.id, paid_on: "2026-10-01",
        amount: "123.45", currency: "INR", reference: "synthetic-ref", note: "Synthetic payment" }.merge(attributes)
    }, as: :json
  end

  it "returns existing profile and employment with empty private defaults without writing a record" do
    get "/api/v1/employee_records", params: { user_id: employee.id }
    expect(response).to have_http_status(:ok)
    record = response.parsed_body.fetch("employee_record")
    expect(record).to include("company_id" => company.id, "can_manage" => true)
    expect(record.fetch("user")).to include("id" => employee.id, "date_of_birth" => employee.date_of_birth&.iso8601)
    expect(record.fetch("employment")).to include("id" => employment.id, "employee_id" => employment.employee_id,
      "joined_at" => employment.joined_at.iso8601)
    expect(record.fetch("private_details")).to include("family_members" => [], "salary_amount" => nil)
    expect(record.fetch("documents")).to eq("pan" => [], "contract" => [])
    expect(EmployeeRecord.count).to eq(0)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
  end

  it "encrypts private JSON, merges partial edits, clears optional fields and audits metadata only" do
    details = { bank_account_number: "123456789", bank_ifsc: "SBIN0001234", bank_swift: "SBININBBXXX",
      emergency_contact_name: "Synthetic contact", salary_amount: "123.45", salary_currency: "INR",
      salary_frequency: "monthly", salary_effective_on: "2026-10-01",
      family_members: [{ name: "Synthetic family", date_of_birth: "2000-01-01", gender: "other", relationship: "sibling" }] }
    update_record(details)
    expect(response).to have_http_status(:ok)
    record = EmployeeRecord.find_by!(employment:)
    expect(record.reload.private_details).to include(details.deep_stringify_keys)
    raw = EmployeeRecord.connection.select_value("SELECT private_details FROM employee_records WHERE id = #{record.id}")
    expect(raw).not_to include("123456789", "Synthetic family", "123.45")
    expect(record.audits.pluck(:audited_changes).to_json).not_to include("123456789", "Synthetic family", "123.45")
    update_record({ bank_account_number: nil })
    expect(response).to have_http_status(:ok)
    expect(record.reload.private_details).to include("bank_account_number" => nil, "salary_amount" => "123.45")
  end

  it "lets active owners manage and active employees edit their own non-salary fields" do
    admin.remove_role(:admin, company)
    admin.add_role(:owner, company)
    update_record({ salary_amount: "100.00" })
    expect(response).to have_http_status(:ok)
    sign_in employee
    get "/api/v1/employee_records"
    expect(response.parsed_body.fetch("employee_record")).to include("can_manage" => false)
    update_record({ emergency_contact_phone: "+91 1234567890" })
    expect(response).to have_http_status(:ok)
    update_record({ salary_amount: nil })
    expect(response).to have_http_status(:forbidden)
    expect(EmployeeRecord.find_by!(employment:).private_details.fetch("salary_amount")).to eq("100.00")
    record_payment
    expect(response).to have_http_status(:forbidden)
  end

  it "allows incomplete active profiles independently of native payroll" do
    admin_employment.update_column(:joined_at, nil)
    employment.update_column(:joined_at, nil)
    get "/api/v1/employee_records", params: { user_id: employee.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("employee_record", "employment", "joined_at")).to be_nil
    update_record({ salary_amount: "100.00", bank_name: "Synthetic Bank" })
    expect(response).to have_http_status(:ok)
    upload_document(kind: "contract")
    expect(response).to have_http_status(:created)
    record_payment
    expect(response).to have_http_status(:created)
    sign_in employee
    update_record({ emergency_contact_name: "Synthetic contact" })
    expect(response).to have_http_status(:ok)
  end

  it "denies coworkers, clients and inactive memberships" do
    sign_in employee
    get "/api/v1/employee_records", params: { user_id: admin.id }
    expect(response).to have_http_status(:forbidden)
    employee.remove_role(:employee, company)
    employee.add_role(:client, company)
    get "/api/v1/employee_records"
    expect(response).to have_http_status(:forbidden)
    sign_in admin
    [:discarded_at, :resigned_at, :joined_at].each do |attribute|
      old = admin_employment.public_send(attribute)
      admin_employment.update_column(attribute, attribute == :joined_at ? Date.tomorrow : Date.yesterday)
      get "/api/v1/employee_records", params: { user_id: employee.id }
      expect(response.status).to be_in([302, 403])
      admin_employment.update_column(attribute, old)
      sign_in admin
    end
  end

  it "scopes shared users to the current employment and rejects stale-company mutations" do
    update_record({ bank_name: "Private to first company" })
    other_company = create(:company)
    create(:employment, company: other_company, user: employee, resigned_at: nil)
    create(:employment, company: other_company, user: admin, resigned_at: nil)
    admin.add_role(:admin, other_company)
    employee.add_role(:employee, other_company)
    admin.update!(current_workspace: other_company)
    sign_out admin
    sign_in User.find(admin.id)
    get "/api/v1/employee_records", params: { user_id: employee.id }
    expect(response).to have_http_status(200)
    expect(response.parsed_body.dig("employee_record", "private_details", "bank_name")).to be_nil
    update_record({ bank_name: "stale" })
    expect(response).to have_http_status(:conflict)
    upload_document
    expect(response).to have_http_status(:conflict)
    record_payment
    expect(response).to have_http_status(:conflict)
    expect(EmployeeRecord.find_by!(employment:).private_details.fetch("bank_name")).to eq("Private to first company")
  end

  it "hides former employees even when roles remain" do
    employment.update_column(:resigned_at, Date.yesterday)
    get "/api/v1/employee_records", params: { user_id: employee.id }
    expect(response).to have_http_status(:not_found)
    update_record({ bank_name: "test" })
    expect(response).to have_http_status(:not_found)
  end

  it "rejects malformed, unknown and invalid private details without writing" do
    [[], "bad", { unexpected: "x" }, { bank_name: [] }, { bank_name: "x" * 201 },
      { family_members: {} }, { family_members: [{}] * 21 }, { family_members: [{ unknown: "x" }] },
      { family_members: [{ name: "x", date_of_birth: Date.tomorrow.iso8601 }] },
      { family_members: [{ name: "x", date_of_birth: "2026-02-30" }] },
      { bank_account_number: "123bad" }, { bank_ifsc: "wrong" }, { bank_swift: "wrong" },
      { salary_amount: "1.234" }, { salary_amount: "0" }, { salary_currency: "ZZZ" },
      { salary_frequency: "weekly" }, { salary_effective_on: "bad" }].each do |details|
      update_record(details)
      expect(response.status).to be_in([400, 422]), "#{details.inspect}: #{response.body}"
      expect(EmployeeRecord.count).to eq(0)
    end
    update_record({}, company_id: nil)
    expect(response).to have_http_status(:conflict)
  end

  it "rejects malformed envelopes and unsupported top-level fields" do
    ["bad", [], { company_id: company.id, user_id: employee.id, private_details: {}, unexpected: "x" }].each do |value|
      patch "/api/v1/employee_records", params: { employee_record: value }, as: :json
      expect(response).to have_http_status(400)
    end
    record_payment(note: { unexpected: "value" })
    expect(response).to have_http_status(422)
    expect(EmployeePayment.count).to eq(0)
  end

  it "retains PAN versions, restricts contract upload and privately downloads exact bytes through employment" do
    sign_in employee
    2.times do
      upload_document
      expect(response).to have_http_status(:created)
    end
    document = EmployeeDocument.order(:id).last
    expect(EmployeeDocument.where(employment:, kind: "pan").count).to eq(2)
    expect(response.body).not_to include(document.file.blob.key, "signed_id", "active_storage")
    upload_document(kind: "contract")
    expect(response).to have_http_status(:forbidden)
    get "/api/v1/employee_records/documents/#{document.id}", params: { user_id: employee.id, kind: "pan" }
    expect(response).to have_http_status(:ok)
    expect(response.body).to eq(document.file.download)
    expect(response.headers["Content-Disposition"]).to start_with("attachment;")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
    get "/api/v1/employee_records/documents/#{document.id}", params: { kind: "contract" }
    expect(response).to have_http_status(:not_found)
    sign_in admin
    upload_document(kind: "contract")
    expect(response).to have_http_status(:created)
    sign_in employee
    get "/api/v1/employee_records/documents/#{EmployeeDocument.last.id}", params: { kind: "contract" }
    expect(response).to have_http_status(:ok)
    get "/api/v1/employee_records/documents/#{document.id}", params: { user_id: admin.id, kind: "pan" }
    expect(response).to have_http_status(:forbidden)
  end

  it "does not expose a shared user's documents or payments from another company" do
    upload_document
    document = EmployeeDocument.last
    record_payment
    other_company = create(:company)
    create(:employment, company: other_company, user: employee, resigned_at: nil)
    create(:employment, company: other_company, user: admin, resigned_at: nil)
    admin.add_role(:admin, other_company)
    employee.add_role(:employee, other_company)
    admin.update!(current_workspace: other_company)
    sign_out admin
    sign_in User.find(admin.id)
    get "/api/v1/employee_records/documents/#{document.id}", params: { user_id: employee.id, kind: "pan" }
    expect(response).to have_http_status(404)
    get "/api/v1/employee_records/payments", params: { user_id: employee.id }
    expect(response.parsed_body.fetch("employee_payments")).to eq([])
  end

  it "accepts a PNG and handles a missing private file without leaking storage details" do
    upload_document(file: Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/test-image.png"), "image/png"))
    expect(response).to have_http_status(201)
    document = EmployeeDocument.last
    expect(response.parsed_body.fetch("employee_document")).to include("content_type" => "image/png")
    allow_any_instance_of(ActiveStorage::Blob).to receive(:download).and_raise(ActiveStorage::FileNotFoundError)
    get "/api/v1/employee_records/documents/#{document.id}", params: { user_id: employee.id, kind: "pan" }
    expect(response).to have_http_status(404)
    expect(response.parsed_body.fetch("errors")).to eq("Document is unavailable. Please contact your workspace administrator.")
  end

  it "rejects disguised, oversized, public, unknown-kind and blob-identifier uploads" do
    upload_document(kind: "unknown")
    expect(response).to have_http_status(422)
    upload_document(file: "signed-blob-id")
    expect(response).to have_http_status(422)
    file = Tempfile.new(["synthetic", ".pdf"])
    ["<html>not a PDF</html>", "%PDF-1.4\n" + (" " * 5.megabytes)].each do |bytes|
      file.rewind
      file.truncate(0)
      file.write(bytes)
      file.flush
      upload_document(file: Rack::Test::UploadedFile.new(file.path, "application/pdf"))
      expect(response).to have_http_status(422)
    end
    allow(ActiveStorage::Blob.service).to receive(:public?).and_return(true)
    upload_document
    expect(response).to have_http_status(422)
    expect(EmployeeDocument.count).to eq(0)
  ensure
    file&.close!
  end

  it "validates manual payments, prevents duplicate references and paginates only the authorized employment" do
    record_payment
    expect(response).to have_http_status(:created)
    expect(response.parsed_body.fetch("employee_payment")).to include("amount" => "123.45", "created_by_id" => admin.id)
    record_payment
    expect(response).to have_http_status(422)
    [{ amount: "0" }, { amount: "1.234" }, { amount: "NaN" }, { currency: "ZZZ" },
      { paid_on: "2026-02-30" }, { reference: "" }, { note: "x" * 2001 }].each do |attributes|
      record_payment(**attributes.merge(reference: attributes.fetch(:reference, "new-ref")))
      expect(response).to have_http_status(422)
    end
    20.times { |i| record_payment(reference: "new-#{i}") }
    sign_in employee
    get "/api/v1/employee_records/payments"
    expect(response.parsed_body.fetch("employee_payments").size).to eq(20)
    expect(response.parsed_body.fetch("pagination")).to include("page" => 1, "has_more" => true)
    get "/api/v1/employee_records/payments", params: { page: 2 }
    expect(response.parsed_body.fetch("employee_payments").size).to eq(1)
    get "/api/v1/employee_records/payments", params: { page: [2] }
    expect(response).to have_http_status(400)
  end

  it "filters submitted private values and payment notes from request logs" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    filtered = filter.filter("employee_record" => { "private_details" => { "bank_name" => "private" } },
      "employee_payment" => { "note" => "private" }, "employee_document" => { "file" => "private" })
    expect(filtered.to_json).not_to include("private")
  end

  it "rejects cookie mutations without CSRF protection" do
    controller = Api::V1::EmployeeRecordsController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    update_record({ bank_name: "private" })
    expect(response).to have_http_status(422)
  ensure
    controller.allow_forgery_protection = original
  end
end
