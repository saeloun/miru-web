# frozen_string_literal: true

require "rails_helper"

RSpec.describe Wise::Api, :wise do
  describe "#initialize" do
    subject { Wise::Api.new }

    it "returns object with faraday connection" do
      expect(subject.connection.class).to be Faraday::Connection
      expect(subject.profile_id.present?).to be true
    end
  end

  describe "#fetch_bank_requirements" do
    subject { Wise::Api.new.fetch_bank_requirements(source_currency, target_currency) }

    let(:source_currency) { "USD" }
    let(:target_currency) { "INR" }

    context "when wise request is success", vcr: { cassette_name: "wise_bank_requirements_success" } do
      it "returns bank requirements in response" do
        expect(subject.status).to eq 200
        expect(JSON.parse(subject.body).first["type"]).to eq "indian"
      end
    end

    context "when wise returns error", vcr: { cassette_name: "wise_bank_requirements_failure" } do
      let(:source_currency) { nil }
      let(:target_currency) { nil }

      it "returns error message in response" do
        expect(subject.status).to eq 422
        expect(JSON.parse(subject.body)["errors"].first["code"]).to eq "NOT_VALID"
      end
    end
  end

  describe "#validate_account_details" do
    subject { Wise::Api.new.validate_account_details(pathname, search) }

    let(:pathname) { "/v1/validators/ifsc-code" }
    let(:search) { "?ifscCode=#{code}" }
    let(:code) { "UTIB0002508" }

    context "when wise request is success", vcr: { cassette_name: "wise_validate_account_success" } do
      it "returns bank requirements in response" do
        expect(subject.status).to eq 200
        expect(JSON.parse(subject.body)["validation"]).to eq "success"
      end
    end

    context "when wise returns error", vcr: { cassette_name: "wise_validate_account_error" } do
      let(:code) { "UTIB" }

      it "returns error message in response" do
        expect(subject.status).to eq 400
        expect(JSON.parse(subject.body)["errors"].first["code"]).to eq "VALIDATION_NOT_SUCCESSFUL"
      end
    end
  end
end
