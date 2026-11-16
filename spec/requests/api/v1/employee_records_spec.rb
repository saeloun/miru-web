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
    expect(record.fetch("bank_countries")).to include("IN" => "India")
    expect(record.fetch("bank_countries")).not_to have_key("ZZ")
    expect(EmployeeRecord.count).to eq(0)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
  end

  it "encrypts private JSON, merges partial edits, clears optional fields and audits metadata only" do
    details = { bank_account_number: "123456789", bank_ifsc: "SBIN0001234", bank_swift: "SBININBBXXX",
      emergency_contact_name: "Synthetic contact", salary_amount: "123.45", salary_currency: "INR",
      salary_frequency: "monthly", salary_effective_on: "2026-10-01",
      family_members: [{ name: "Synthetic family", date_of_birth: "2000-01-01", gender: "other", relationship: "sibling" }] }
    update_record(details, bank_account_number_confirmation: details.fetch(:bank_account_number))
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

  it "redacts private employee parameters captured by the actual controller trace" do
    transaction = Sentry::Transaction.new(name: "Employee trace privacy", sampled: true, hub: Sentry.get_current_hub)
    span = Sentry::Span.new(transaction:, op: "view.process_action.action_controller", description: "Api::V1::EmployeeRecordsController#update")
    allow(Sentry).to receive(:with_child_span).and_wrap_original do |original, **attributes, &block|
      attributes[:description] == span.description ? block.call(span) : original.call(**attributes, &block)
    end

    update_record({ bank_account_number: "000123456789", salary_amount: "123.45" }, bank_account_number_confirmation: "000123456789")

    expect(response).to have_http_status(:ok)
    expect(span.to_hash.dig(:data, :params, "employee_record", "private_details"))
      .to include("bank_account_number" => "000123456789", "salary_amount" => "123.45")
    event = Sentry::TransactionEvent.new(transaction:, configuration: Sentry.configuration)
    event.spans = [span.to_hash]
    event = Sentry.configuration.before_send_transaction.call(event, {})
    expect(event.spans.first.dig(:data, :params, "employee_record")).to eq("[FILTERED]")
    expect(event.spans.to_json).not_to include("000123456789", "123.45")

    patch "/api/v1/employee_records", params: {
      account_number: "000987654321", bank_account_number_confirmation: "000987654321",
      salary: "987.65", salary_amount: "987.65", page: "2"
    }, as: :json
    expect(response).to have_http_status(:bad_request)
    expect(Employment.find(employment.id).employee_record.private_details)
      .to include("bank_account_number" => "000123456789", "salary_amount" => "123.45")
    expect(span.to_hash.dig(:data, :params, "account_number")).to eq("000987654321")
    event.spans = [span.to_hash]
    event = Sentry.configuration.before_send_transaction.call(event, {})
    expect(event.spans.first.dig(:data, :params)).to include(
      "account_number" => "[FILTERED]", "bank_account_number_confirmation" => "[FILTERED]",
      "salary" => "[FILTERED]", "salary_amount" => "[FILTERED]", "page" => "2")
    expect(event.spans.to_json).not_to include("000987654321", "987.65")
  end

  it "redacts other private trace envelopes while preserving safe and non-parameter data" do
    transaction = Sentry::Transaction.new(name: "Private trace envelopes", sampled: true, hub: Sentry.get_current_hub)
    envelopes = {
      "Api::V1::TaxDeclarationsController#create" => { "tax_declaration" => { "claimed_amount" => "456.78", "notes" => "Private tax note" } },
      "Api::V1::TaxDeclarationsController#review" => { "review" => { "decision" => "approve", "approved_amount" => "456.78", "reason" => "Private review reason" } },
      "Api::V1::AgreementsController#create" => { "agreement" => { "body" => "Private agreement text" } },
      "Api::V1::SignatureRequestsController#create" => { "signature_request" => { title: "Private signature title", recipients: [{ email: "private@example.test" }] }.to_json }
    }
    spans = envelopes.map do |description, params|
      span = Sentry::Span.new(transaction:, op: "view.process_action.action_controller", description:)
      span.set_data(:params, params.merge("page" => "2"))
      span.to_hash
    end
    unaffected = [{ description: "SQL", data: { query: "SELECT 1" } }, { description: "No data" },
      { description: "Non-hash params", data: { params: "unchanged" } }]
    event = Sentry::TransactionEvent.new(transaction:, configuration: Sentry.configuration)
    event.spans = spans + unaffected.deep_dup
    event = Sentry.configuration.before_send_transaction.call(event, {})

    expect(event.spans[0].dig(:data, :params, "tax_declaration")).to eq("[FILTERED]")
    expect(event.spans[1].dig(:data, :params, "review"))
      .to eq("decision" => "approve", "approved_amount" => "[FILTERED]", "reason" => "[FILTERED]")
    expect(event.spans[2].dig(:data, :params, "agreement")).to eq("[FILTERED]")
    expect(event.spans[3].dig(:data, :params, "signature_request")).to eq("[FILTERED]")
    expect(event.spans.first(4).map { |span| span.dig(:data, :params, "page") }).to eq(%w[2 2 2 2])
    expect(event.spans.last(3)).to eq(unaffected)
    expect(event.spans.to_json).not_to include("456.78", "Private tax note", "Private review reason", "Private agreement text", "Private signature title", "private@example.test")
  end

  context "bank account confirmation" do
    %i[admin employee].each do |actor|
      it "allows #{actor} to save explicit India and USD bank declarations" do
        sign_in public_send(actor)
        update_record({ bank_country: "IN", bank_account_currency: "USD" })

        expect(response).to have_http_status(:ok)
        expect(employment.reload.employee_record.private_details).to include("bank_country" => "IN", "bank_account_currency" => "USD")
        expect(response.parsed_body.dig("employee_record", "private_details")).to include("bank_country" => "IN", "bank_account_currency" => "USD")
      end
    end

    [{ bank_country: "ZZ" }, { bank_country: "in" }, { bank_country: [] },
      { bank_account_currency: "BAD" }, { bank_account_currency: "usd" }, { bank_account_currency: { value: "USD" } }].each do |details|
      it "rejects invalid bank declarations #{details.inspect}" do
        update_record(details)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(employment.reload.employee_record).to be_nil
      end
    end

    it "requires independent confirmation for an initial account entry" do
      expect do
        update_record({ bank_account_number: "000123456789" })
        expect(response).to have_http_status(422)
      end.not_to change(EmployeeRecord, :count)
      expect(response.parsed_body.fetch("errors")).to include("Confirm bank account number")
      expect(response.body).not_to include("000123456789")
    end

    it "rejects mismatched and malformed confirmation without changing encrypted data or audit history" do
      record = EmployeeRecord.create!(employment:, private_details: { bank_account_number: "000111222333", bank_name: "Original bank" })
      ciphertext = EmployeeRecord.connection.select_value("SELECT private_details FROM employee_records WHERE id = #{record.id}")
      audits = record.audits.count
      ["000123456788", 123456789, ["000123456789"], { value: "000123456789" }].each do |confirmation|
        update_record({ bank_account_number: "000123456789", bank_name: "Changed bank" }, bank_account_number_confirmation: confirmation)
        expect(response).to have_http_status(422)
        expect(response.body).not_to include("000123456789", "000123456788")
        expect(EmployeeRecord.connection.select_value("SELECT private_details FROM employee_records WHERE id = #{record.id}")).to eq(ciphertext)
        expect(record.audits.count).to eq(audits)
      end
    end

    it "preserves exact leading zeros without persisting or returning confirmation" do
      update_record({ bank_account_number: "000123456789" }, bank_account_number_confirmation: "000123456789")
      expect(response).to have_http_status(:ok)
      expect(EmployeeRecord.find_by!(employment:).private_details).to eq("bank_account_number" => "000123456789")
      expect(response.parsed_body.dig("employee_record", "private_details", "bank_account_number")).to eq("000123456789")
      expect(response.body).not_to include("bank_account_number_confirmation")
      filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
      expect(filter.filter("employee_record" => { "bank_account_number_confirmation" => "000123456789" }))
        .to eq("employee_record" => "[FILTERED]")
    end

    it "retains account format validation when both entries match" do
      update_record({ bank_account_number: "123bad" }, bank_account_number_confirmation: "123bad")
      expect(response).to have_http_status(422)
      expect(response.parsed_body.fetch("errors")).to include("bank_account_number")
      expect(response.body).not_to include("123bad")
      expect(EmployeeRecord.count).to eq(0)
    end

    it "keeps unchanged, contact-only and clearing edits compatible" do
      record = EmployeeRecord.create!(employment:, private_details: { bank_account_number: "000111222333" })
      update_record({ bank_account_number: "000111222333", emergency_contact_name: "Updated contact" })
      expect(response).to have_http_status(:ok)
      update_record({ emergency_contact_phone: "+91 1234567890" })
      expect(response).to have_http_status(:ok)
      update_record({ bank_account_number: nil })
      expect(response).to have_http_status(:ok)
      expect(record.reload.private_details.fetch("bank_account_number")).to be_nil
      update_record({ bank_account_number: "000111222333" }, bank_account_number_confirmation: "000111222333")
      expect(response).to have_http_status(:ok)
      update_record({ bank_account_number: "" })
      expect(response).to have_http_status(:ok)
      expect(record.reload.private_details.fetch("bank_account_number")).to eq("")
    end

    it "enforces the same boundary for a self-service token client" do
      sign_out admin
      headers = { "X-Auth-Email" => employee.email, "X-Auth-Token" => employee.token }
      attributes = { company_id: company.id, user_id: employee.id, private_details: { bank_account_number: "000123456789" } }
      patch "/api/v1/employee_records", params: { employee_record: attributes }, headers:, as: :json
      expect(response).to have_http_status(422)
      expect(EmployeeRecord.count).to eq(0)
      patch "/api/v1/employee_records", params: { employee_record: attributes.merge(bank_account_number_confirmation: "000123456789") }, headers:, as: :json
      expect(response).to have_http_status(:ok)
      expect(EmployeeRecord.find_by!(employment:).private_details.fetch("bank_account_number")).to eq("000123456789")
    end
  end

  it "allows active Admin prehire preparation without allowing a future employee to access records early" do
    employment.update_columns(joined_at: Date.tomorrow)
    get "/api/v1/employee_records", params: { user_id: employee.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("employee_record", "employment", "joined_at")).to eq(Date.tomorrow.iso8601)
    update_record({ emergency_contact_name: "Future staff contact" })
    expect(response).to have_http_status(:ok)
    sign_in employee
    get "/api/v1/employee_records", params: { user_id: employee.id }
    expect(response).to have_http_status(:forbidden)
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
    sign_out employee
    _session, token = CliSession.issue_for(user: employee, company:)
    get "/api/v1/employee_records/documents/#{document.id}", params: { kind: "pan" },
      headers: { "Authorization" => "Bearer #{token}" }
    expect(response).to have_http_status(:ok)
    expect(response.body).to eq(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")))
    expect(document.audits.where(action: "download", associated: company, user: employee).count).to eq(2)
    sign_in employee
    get "/api/v1/employee_records/documents/#{document.id}", params: { kind: "contract" }
    expect(response).to have_http_status(:not_found)
    sign_in admin
    upload_document(kind: "contract")
    expect(response).to have_http_status(:created)
    contract = EmployeeDocument.last
    get "/api/v1/employee_records/documents/#{contract.id}", params: { user_id: employee.id, kind: "contract" }
    expect(response).to have_http_status(:ok)
    expect(response.body).to eq(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")))
    expect(contract.audits.where(action: "download").count).to eq(1)
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

  %w[workspace role actor_employment target_employment].each do |change|
    it "withholds private document bytes after a #{change} change during storage download" do
      upload_document
      document = EmployeeDocument.last
      other_company = create(:company) if change == "workspace"
      allow_any_instance_of(ActiveStorage::Blob).to receive(:download).and_wrap_original do |original, *arguments|
        bytes = original.call(*arguments)
        case change
        when "workspace" then admin.update!(current_workspace: other_company)
        when "role" then admin.remove_role(:admin, company)
        when "actor_employment" then admin_employment.update_column(:resigned_at, Date.yesterday)
        when "target_employment" then employment.update_column(:resigned_at, Date.yesterday)
        end
        bytes
      end

      get "/api/v1/employee_records/documents/#{document.id}", params: { user_id: employee.id, kind: "pan" }
      expect(response).to have_http_status(change == "target_employment" ? :not_found : :forbidden)
      expect(response.body).not_to include("%PDF")
      expect(document.audits.where(action: "download")).to be_empty
    end
  end

  it "withholds private document bytes when the attachment changes during storage download" do
    upload_document
    document = EmployeeDocument.last
    replacement = File.open(Rails.root.join("spec/support/fixtures/pdf-file.pdf")) do |io|
      ActiveStorage::Blob.create_and_upload!(io:, filename: "replacement.pdf", content_type: "application/pdf")
    end
    allow_any_instance_of(ActiveStorage::Blob).to receive(:download).and_wrap_original do |original, *arguments|
      bytes = original.call(*arguments)
      document.file_attachment.update!(blob: replacement)
      bytes
    end

    get "/api/v1/employee_records/documents/#{document.id}", params: { user_id: employee.id, kind: "pan" }
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include("%PDF")
    expect(document.audits.where(action: "download")).to be_empty
  end

  it "reports a missing attachment without returning private document bytes" do
    upload_document
    document = EmployeeDocument.last
    document.file.purge

    get "/api/v1/employee_records/documents/#{document.id}", params: { user_id: employee.id, kind: "pan" }
    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body.fetch("errors")).to eq("Document is unavailable. Please contact your workspace administrator.")
    expect(document.audits.where(action: "download")).to be_empty
  end

  it "keeps profiles readable when a retained document has lost its attachment" do
    upload_document
    missing = EmployeeDocument.last
    missing.file.purge
    upload_document
    pan = EmployeeDocument.last
    upload_document(kind: "contract")
    contract = EmployeeDocument.last

    sign_in employee
    get "/api/v1/employee_records"

    expect(response).to have_http_status(:ok)
    documents = response.parsed_body.fetch("employee_record").fetch("documents")
    expect(documents.fetch("pan").pluck("id")).to eq([pan.id])
    expect(documents.fetch("contract").pluck("id")).to eq([contract.id])
    expect(EmployeeDocument.exists?(missing.id)).to be(true)
    expect(missing.audits).to exist
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
