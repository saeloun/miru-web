# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::WiseController, type: :controller do
  let(:company) { create(:company) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: employee)
    employee.add_role :employee, company
    sign_in employee
  end

  describe "GET fetch_bank_requirements" do
    subject { get :fetch_bank_requirements, params: }

    let(:params) do
      {
        source_currency: "USD",
        target_currency: "INR",
        source_amount: 1000
      }
    end

    context "when response from wise is success", vcr: { cassette_name: "wise_bank_requirements_success" } do
      it "returns json data for bank requirements" do
        subject
        expect(response.status).to eq 200
        expect(JSON.parse(response.body).first["fields"].count).to eq 7
        expect(JSON.parse(response.body).first["type"]).to eq "indian"
      end
    end

    context "when wise returns an error" do
      let(:status) { 500 }

      it_behaves_like "Internal::V1::WiseController error response from wise"
    end
  end

  describe "GET validate_account_details" do
    subject { get :validate_account_details, params: }

    let(:params) do
      {
        pathname: "/v1/validators/ifsc-code",
        search: "?ifscCode=#{ifsc_code}"
      }
    end
    let(:ifsc_code) { "UTIB0002508" }

    context "when param is valid", vcr: { cassette_name: "wise_validate_account_success" } do
      it "returns success response" do
        expect(subject.status).to eq 200

        expect(JSON.parse(response.body)["validation"]).to eq "success"
      end
    end

    context "when param is not valid", vcr: { cassette_name: "wise_validate_account_error" } do
      let(:ifsc_code) { "UTIB" }

      it "returns error response" do
        expect(subject.status).to eq 400
        expect(JSON.parse(response.body)["errors"].first["code"]).to eq "VALIDATION_NOT_SUCCESSFUL"
      end
    end

    context "when wise returns error" do
      let(:status) { 500 }

      it_behaves_like "Internal::V1::WiseController error response from wise"
    end
  end
end
