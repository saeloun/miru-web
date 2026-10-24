# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Company signing connections", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:origin) { "https://signing.example.test" }
  let(:key) { "api_synthetic_company_key" }
  let(:path) { "/api/v1/signature_connection" }

  before do
    admin.add_role(:owner, company)
    sign_in admin
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return(origin)
  end

  def connect(**attributes)
    post path, params: { signature_connection: { company_id: company.id, previous_id: nil, api_key: key }.merge(attributes) }, as: :json
  end

  def provider_response
    stub_request(:get, "#{origin}/api/v2/envelope?perPage=1").with(headers: { "Authorization" => key })
      .to_return(body: { data: [], count: 0, currentPage: 1, perPage: 1, totalPages: 0 }.to_json,
        headers: { "Content-Type" => "application/json" })
  end

  it "reports missing configuration without making a provider request" do
    get path
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("signature_connection")).to include("configured" => false, "server_configured" => true, "id" => nil)
    expect(response.headers["Cache-Control"]).to include("no-store")
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return(nil)
    get path
    expect(response.parsed_body.dig("signature_connection", "server_configured")).to be(false)
    expect(WebMock).not_to have_requested(:any, /example.test/)
  end

  it "checks the supplied key, stores ciphertext and returns only connection metadata" do
    provider = provider_response
    connect
    expect(response).to have_http_status(:created)
    connection = SignatureConnection.find(response.parsed_body.dig("signature_connection", "id"))
    expect(connection.company_id).to eq(company.id)
    expect(connection.api_key).to eq(key)
    expect(connection.read_attribute_before_type_cast(:api_key)).not_to include(key)
    expect(connection.inspect).not_to include(key)
    expect(connection.provider_origin).to eq(origin)
    expect(response.body).not_to include(key, "api_key", origin)
    expect(response.parsed_body.dig("signature_connection", "configured")).to be(true)
    expect(provider).to have_been_requested.once
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    expect(filter.filter("signature_connection" => { "api_key" => key }).fetch("signature_connection")).to eq("[FILTERED]")
  end

  it "preserves old credential versions and rejects stale rotation attempts" do
    provider_response
    connect
    expect(response).to have_http_status(:created)
    first = SignatureConnection.find(response.parsed_body.dig("signature_connection", "id"))
    next_key = "api_synthetic_rotated_key"
    stub_request(:get, "#{origin}/api/v2/envelope?perPage=1").with(headers: { "Authorization" => next_key })
      .to_return(body: '{"data":[]}', headers: { "Content-Type" => "application/json" })
    connect(previous_id: first.id, api_key: next_key)
    expect(response).to have_http_status(:created)
    second_id = response.parsed_body.dig("signature_connection", "id")
    expect(first.reload.disabled_at).to be_present
    expect(first.api_key).to eq(key)
    expect(SignatureConnection.active.where(company:).pluck(:id)).to eq([second_id])

    connect(previous_id: first.id)
    expect(response).to have_http_status(:conflict)
    expect(SignatureConnection.active.where(company:).pluck(:id)).to eq([second_id])
    expect(first.update(api_key: "api_changed")).to be(false)
  end

  it "denies employees, resigned admins and credentials from another workspace" do
    admin.remove_role(:owner, company)
    admin.add_role(:employee, company)
    get path
    expect(response).to have_http_status(:forbidden)
    connect
    expect(response).to have_http_status(:forbidden)

    admin.remove_role(:employee, company)
    admin.add_role(:owner, company)
    membership.update_columns(resigned_at: Date.yesterday)
    get path
    expect(response).to have_http_status(:forbidden)
    membership.update_columns(resigned_at: nil)
    connect(company_id: create(:company).id)
    expect(response).to have_http_status(:conflict)
    expect(SignatureConnection.count).to eq(0)
    expect(WebMock).not_to have_requested(:any, /example.test/)
  end

  it "denies tenant-selected provider origins and malformed credentials before HTTP" do
    connect(provider_origin: "https://attacker.example.test")
    expect(response).to have_http_status(:bad_request)
    [nil, "", "a" * 4097, { value: key }].each do |value|
      connect(api_key: value)
      expect(response).to have_http_status(:bad_request)
    end
    expect(WebMock).not_to have_requested(:any, /example.test/)
  end

  it "keeps a rejected or unavailable connection unconfigured and sanitizes errors" do
    stub_request(:get, "#{origin}/api/v2/envelope?perPage=1").to_return(status: 401, body: "private trace #{key}")
    connect
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.body).not_to include(key, "private trace")
    expect(SignatureConnection.count).to eq(0)
    stub_request(:get, "#{origin}/api/v2/envelope?perPage=1").to_timeout
    connect
    expect(response).to have_http_status(:service_unavailable)
    expect(SignatureConnection.count).to eq(0)
  end

  it "rechecks membership after the external credential check" do
    stub_request(:get, "#{origin}/api/v2/envelope?perPage=1").to_return do
      membership.update_columns(discarded_at: Time.current)
      { body: '{"data":[]}', headers: { "Content-Type" => "application/json" } }
    end
    connect
    expect(response).to have_http_status(:forbidden)
    expect(SignatureConnection.count).to eq(0)
  end

  it "prevents an existing key from being sent to a changed server origin" do
    provider_response
    connect
    connection = SignatureConnection.find(response.parsed_body.dig("signature_connection", "id"))
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return("https://replacement.example.test")
    get path
    expect(response.parsed_body.dig("signature_connection", "configured")).to be(false)
    expect { connection.client.get("envelope_1") }.to raise_error(Signatures::DocumensoClient::ConfigurationError)
    expect(WebMock).not_to have_requested(:any, /replacement.example.test/)
  end

  it "allows a fresh connection after an operator changes the provider origin" do
    provider_response
    connect
    previous_id = response.parsed_body.dig("signature_connection", "id")
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return("https://replacement.example.test")
    next_key = "api_new_provider_key"
    stub_request(:get, "https://replacement.example.test/api/v2/envelope?perPage=1")
      .with(headers: { "Authorization" => next_key }).to_return(body: '{"data":[]}', headers: { "Content-Type" => "application/json" })
    connect(previous_id:, api_key: next_key)
    expect(response).to have_http_status(:created)
    expect(SignatureConnection.find(previous_id).disabled_at).to be_present
    expect(SignatureConnection.active.find_by!(company:).provider_origin).to eq("https://replacement.example.test")
  end

  it "requires CSRF protection for a cookie-authenticated connection change" do
    controller = Api::V1::SignatureConnectionsController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    connect
    expect(response).to have_http_status(:unprocessable_content)
    expect(WebMock).not_to have_requested(:any, /example.test/)
  ensure
    controller.allow_forgery_protection = original if controller
  end

  it "cannot deactivate a credential version belonging to another company" do
    other = SignatureConnection.create!(company: create(:company), created_by: admin, api_key: key, provider_origin: origin)
    provider_response
    connect(previous_id: other.id)
    expect(response).to have_http_status(:conflict)
    expect(other.reload.disabled_at).to be_nil
    expect(SignatureConnection.active.where(company:)).to be_empty
  end

  it "does not activate credentials after the admin switches workspaces during validation" do
    other = create(:company)
    stub_request(:get, "#{origin}/api/v2/envelope?perPage=1").to_return do
      admin.update!(current_workspace: other)
      { body: '{"data":[]}', headers: { "Content-Type" => "application/json" } }
    end
    connect
    expect(response).to have_http_status(:forbidden)
    expect(SignatureConnection.count).to eq(0)
  end
end
