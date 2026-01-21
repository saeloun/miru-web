# frozen_string_literal: true

require "rails_helper"

RSpec.describe InternalApi::V1::Wise::RecipientsController, type: :controller, wise: true do
  let(:company) { create(:company) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: employee)
    employee.add_role :employee, company
    sign_in employee
  end

  describe "GET show" do
    subject { get :show, params: }

    let(:params) { { recipient_id: } }
    let(:recipient_id) { 148397163 }

    context "when recipient is present", vcr: { cassette_name: "wise_fetch_recipient_success" } do
      it "returns recipient details from wise" do
        expect(subject.status).to eq 200
        expect(JSON.parse(response.body)["id"]).to eq recipient_id
      end
    end

    context "when recipient is missing from wise", vcr: { cassette_name: "wise_fetch_recipient_failure" } do
      let(:recipient_id) { 1483 }

      it "returns error" do
        expect(subject.status).to eq 200
        expect(JSON.parse(response.body)["errors"].first["code"]).to eq "RECIPIENT_MISSING"
      end
    end

    context "when wise returns error" do
      let(:status) { 200 }

      it_behaves_like "Internal::V1::WiseController error response from wise"
    end
  end

  describe "POST create" do
    subject { post :create, params: }

    let!(:params) do
      {
        recipient: {
          profile: 16455649,
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
      }
    end

    context "when recipient is created on wise", vcr: { cassette_name: "wise_create_recipient_success" } do
      it "returns recipient details" do
        expect(subject.status).to eq 200
        expect(JSON.parse(response.body)["business"]).to eq params[:recipient][:profile]
      end
    end

    context "when recipient creation fails", vcr: { cassette_name: "wise_create_recipient_failure" } do
      before { params[:recipient].delete(:currency) }

      it "returns error response" do
        expect(subject.status).to eq 422
        expect(JSON.parse(response.body)["errors"].first["code"]).to eq "NOT_VALID"
      end
    end

    context "when wise returns error" do
      let(:status) { 500 }

      it_behaves_like "Internal::V1::WiseController error response from wise"
    end
  end

  describe "PUT update" do
    subject { put :update, params: }

    let!(:params) do
      {
        recipient_id: 148398162,
        recipient: {
          id: 148398162,
          profile: 16455649,
          accountHolderName: "Sudeep Tarlekar",
          currency: "INR",
          country: "IN",
          type: "indian",
          details: {
            address: {
              country: "IN",
              countryCode: "IN",
              firstLine: "Pune",
              postCode: "560015",
              city: "Pune"
            },
            legalType: "PRIVATE",
            accountNumber: "1234567",
            ifscCode: "UTIB0002580"
          }
        }
      }
    end

    context "when recipient updated successfully", vcr: { cassette_name: "wise_recipient_update_success" } do
      it "updates recipient details" do
        expect(subject.status).to eq 200
        expect(JSON.parse(response.body)["id"]).not_to eq params[:recipient_id]
      end
    end

    context "when recipient update fails", vcr: { cassette_name: "wise_recipient_update_failure" } do
      before { params[:recipient].delete(:currency) }

      it "returns error response" do
        expect(subject.status).to eq 200
        expect(JSON.parse(response.body)["errors"].first["code"]).to eq "NOT_VALID"
      end
    end

    context "when error occurs while updating the recipient" do
      let(:status) { 200 }

      it_behaves_like "Internal::V1::WiseController error response from wise"
    end
  end
end
