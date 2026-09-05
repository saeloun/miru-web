# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Imports#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:cli_token) { CliSession.issue_for(user:, company:).last }
  let(:headers) { cli_auth_headers(cli_token) }
  let(:file) do
    fixture_file_upload(
      Rails.root.join("spec/fixtures/files/harvest_detailed_time.csv"),
      "text/csv"
    )
  end

  before do
    create(:employment, company:, user:)
  end

  it "enqueues an admin dry run" do
    user.add_role :admin, company

    expect do
      send_request :post, api_v1_imports_path, params: {
        file:,
        source: "harvest",
        dry_run: "true",
        assign_unmatched_to: user.email
      }, headers: headers
    end.to have_enqueued_job(DataImportJob)

    expect(response).to have_http_status(:accepted)
    expect(json_response).to include("status" => "pending", "dry_run" => true)
  end

  it "enqueues an admin real import" do
    user.add_role :admin, company

    expect do
      send_request :post, api_v1_imports_path, params: {
        file:,
        source: "harvest"
      }, headers: headers
    end.to have_enqueued_job(DataImportJob)

    expect(response).to have_http_status(:accepted)
    expect(json_response).to include("status" => "pending", "dry_run" => false)
  end

  it "allows an owner to create an import" do
    user.add_role :owner, company

    send_request :post, api_v1_imports_path, params: {
      file:,
      source: "harvest",
      dry_run: "true",
      assign_unmatched_to: user.email
    }, headers: headers

    expect(response).to have_http_status(:accepted)
  end

  it "stores array user mappings in the import options" do
    user.add_role :admin, company

    send_request :post, api_v1_imports_path, params: {
      file:,
      source: "harvest",
      user_map: ["Paul Connors=paul@example.com", "Jane Doe=jane@example.com"]
    }, headers: headers

    expect(response).to have_http_status(:accepted)
    expect(DataImport.last.options["user_map"]).to eq(
      "Paul Connors" => "paul@example.com",
      "Jane Doe" => "jane@example.com"
    )
  end

  it "stores JSON object user mappings in the import options" do
    user.add_role :admin, company

    send_request :post, api_v1_imports_path, params: {
      file:,
      source: "harvest",
      user_map: { "Paul Connors" => "paul@example.com" }.to_json
    }, headers: headers

    expect(response).to have_http_status(:accepted)
    expect(DataImport.last.options["user_map"]).to eq("Paul Connors" => "paul@example.com")
  end

  it "forbids an employee" do
    user.add_role :employee, company

    send_request :post, api_v1_imports_path, params: { file:, source: "harvest" }, headers: headers

    expect(response).to have_http_status(:forbidden)
  end

  it "returns an unprocessable response when the file is missing" do
    user.add_role :admin, company

    send_request :post, api_v1_imports_path, params: { source: "harvest" }, headers: headers

    expect(response).to have_http_status(422)
    expect(json_response).to eq("errors" => "File is required")
  end

  it "returns an unprocessable response for a malformed user mapping" do
    user.add_role :admin, company

    send_request :post, api_v1_imports_path, params: {
      file:,
      source: "harvest",
      user_map: ["Paul Connors"]
    }, headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
    expect(json_response).to eq("errors" => "User mappings must use First Last=email")
  end

  it "returns an unprocessable response for more than 500 user mappings" do
    user.add_role :admin, company

    send_request :post, api_v1_imports_path, params: {
      file:,
      source: "harvest",
      user_map: Array.new(501) { |index| "Person #{index}=person#{index}@example.com" }
    }, headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
    expect(json_response).to eq("errors" => "User mappings must use First Last=email")
  end

  it "returns an unprocessable response for a non-CSV file" do
    user.add_role :admin, company
    text_file = Rack::Test::UploadedFile.new(
      Rails.root.join("spec/fixtures/files/harvest_detailed_time.csv"),
      "text/plain",
      original_filename: "harvest.txt"
    )

    send_request :post, api_v1_imports_path, params: { file: text_file, source: "harvest" }, headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
    expect(json_response).to eq("errors" => "File must be a CSV")
  end

  it "returns an unprocessable response for an oversized file" do
    user.add_role :admin, company
    allow_any_instance_of(ActionDispatch::Http::UploadedFile).to receive(:size).and_return(20.megabytes + 1)

    send_request :post, api_v1_imports_path, params: { file:, source: "harvest" }, headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
    expect(json_response).to eq("errors" => "File must be 20 MB or smaller")
  end

  it "returns an unprocessable response when required headers are missing" do
    user.add_role :admin, company
    invalid_file = fixture_file_upload(
      Rails.root.join("spec/fixtures/files/harvest_missing_headers.csv"),
      "text/csv"
    )

    send_request :post, api_v1_imports_path, params: {
      file: invalid_file,
      source: "harvest"
    }, headers: headers

    expect(response).to have_http_status(422)
    expect(json_response["errors"]).to include("Missing required headers")
  end
end
