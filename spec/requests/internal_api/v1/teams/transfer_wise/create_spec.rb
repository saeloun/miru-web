# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Teams::TransferWise#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      wise_create_account_resp = {
        "currency": "USD",
        "id": "123",
        "details": {
          "accountNumber": "41547869797976",
          "bankName": "United Bank"
        }
      }
      Wise::PayoutApi.any_instance.stub(:create_recipient_account)
        .and_return(wise_create_account_resp.with_indifferent_access)
      send_request :post, internal_api_v1_teams_transfer_wise_index_path, params: {
        recipient: {
          currency: "USD",
          profile: "123",
          type: "PRIVATE",
          accountHolderName: "Ann Johnson",
          ownedByCustomer: "",
          details: {
            address: {
              country: "GB",
              countryCode: "GB",
              firstLine: "112 2nd street",
              postCode: "SW1P 3",
              city: "London",
              state: nil
            },
            email: "someone@somewhere.com",
            legalType: "PRIVATE",
            accountNumber: "28821822",
            sortCode: "231470"
          }
        }
      }
    end

    it "they should be able to create the record successfully" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["recipient_id"]).to eq "123"
      expect(json_response["bank_name"]).to eq "United Bank"
      expect(json_response["currency"]).to eq "USD"
      expect(json_response["last_four_digits"]).to eq "7976"
    end
  end

  context "when unauthenticated" do
    it "user will be redirected to sign in path" do
      send_request :post, internal_api_v1_teams_transfer_wise_index_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to match("You need to sign in or sign up before continuing.")
    end
  end
end
