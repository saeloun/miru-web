# frozen_string_literal: true

require "rails_helper"

RSpec.describe Wise::Recipient, :wise do
  describe "#create" do
    subject { Wise::Recipient.new.create(payload) }

    let(:payload) do
      {
        currency: "USD",
        type: "swift_code",
        accountHolderName: "Sudeep Anil Tarlekar",
        country: "GB",
        details: {
          legalType: "BUSINESS",
          swiftCode: "TRWIGB2L",
          accountNumber: "GB46 TRWI 2314 7025 5421 89",
          address: {
            country: "GB",
            countryCode: "GB",
            city: "London",
            firstLine: "Times Square",
            postCode: 56001
          }
        }
      }
    end

    context "when wise api is success", vcr: { cassette_name: "wise_create_recipient_success" } do
      it "creates recipient on wise" do
        expect(subject.status).to eq 200
        expect(JSON.parse(subject.body)["id"]).to eq 148397619
      end
    end

    context "when wise api is failure", vcr: { cassette_name: "wise_create_recipient_failure" } do
      it "creates recipient on wise" do
        expect(subject.status).to eq 422
        expect(JSON.parse(subject.body)["errors"].first["code"]).to eq "NOT_VALID"
      end
    end
  end

  describe "#fetch" do
    subject { Wise::Recipient.new.fetch(recipient_id) }

    context "when wise api is success", vcr: { cassette_name: "wise_fetch_recipient_success" } do
      let(:recipient_id) { 148397163 }

      it "returns recipient details from wise" do
        expect(subject["id"]).to eq recipient_id
      end
    end

    context "when wise api is failure", vcr: { cassette_name: "wise_fetch_recipient_failure" } do
      let(:recipient_id) { 1483 }

      it "returns error" do
        expect(subject["errors"].first["code"]).to eq "RECIPIENT_MISSING"
      end
    end
  end

  describe "#update" do
    subject { Wise::Recipient.new.update(payload) }

    let!(:payload) do
      {
        "id" => 148398162,
        "profile" => 16455649,
        "accountHolderName" => "Sudeep Tarlekar",
        "currency" => "INR",
        "country" => "IN",
        "type" => "indian",
        "details" => {
          "address" => {
            "country" => "IN",
            "countryCode" => "IN",
            "firstLine" => "Pune",
            "postCode" => "560015",
            "city" => "Pune"
          },
          "legalType" => "PRIVATE",
          "accountNumber" => "1234567",
          "ifscCode" => "UTIB0002580"
        }
      }
    end

    context "when update is success", vcr: { cassette_name: "wise_recipient_update_success" } do
      it "returns updated recipient params" do
        expect(subject.status).to eq 200
        expect(JSON.parse(subject.body)["id"]).not_to eq payload[:recipient_id]
      end
    end

    context "when update is failure", vcr: { cassette_name: "wise_recipient_update_failure" } do
      before { payload.delete("currency") }

      it "returns updated recipient params" do
        expect(subject.status).to eq 422
        expect(JSON.parse(subject.body)["errors"].first["code"]).to eq "NOT_VALID"
      end
    end
  end

  describe "#delete" do
    subject { Wise::Recipient.new.delete(recipient_id) }

    context "when recipient is present", vcr: { cassette_name: "wise_recipient_delete_success" } do
      let(:recipient_id) { 148398162 }

      it "returns successful empty response" do
        expect(subject.status).to eq 200
        expect(subject.body).to eq ""
      end
    end

    context "when recipient is missing from wise", vcr: { cassette_name: "wise_recipient_delete_failure" } do
      let(:recipient_id) { 1483 }

      it "returns error" do
        expect(subject.status).to eq 403
        expect(JSON.parse(subject.body)["errors"].first["code"]).to eq "RECIPIENT_MISSING"
      end
    end
  end
end
