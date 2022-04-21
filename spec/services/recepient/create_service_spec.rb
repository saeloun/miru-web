# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Recipient::CreateService", type: :service do
  describe "#process" do
    let(:company) { create(:company) }
    let(:user) { create(:user, current_workspace_id: company.id) }
    let(:wise_create_account_request) {
      {
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
    }

    context "when pay_out api returns success" do
      before do
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
      end

      it "returns success response" do
        create_service = Recipient::CreateService.new(user:, recipient_account_params: wise_create_account_request)
        response = create_service.process
        expect(response[:recipient_id]).to eq "123"
        expect(response[:bank_name]).to eq "United Bank"
        expect(response[:currency]).to eq "USD"
        expect(response[:last_four_digits]).to eq "7976"
      end
    end

    context "when pay_out api returns error" do
      before do
        wise_create_account_error_resp = {
          "errors": [
            {
              "code": "error.route.not.supported",
              "message": "This route is not supported"
            }
          ]
        }
        Wise::PayoutApi.any_instance.stub(:create_recipient_account)
          .and_return(wise_create_account_error_resp.with_indifferent_access)
      end

      it "returns error response" do
        create_service = Recipient::CreateService.new(user:, recipient_account_params: wise_create_account_request)
        response = create_service.process
        expect(response[:errors][0]["code"]).to eq "error.route.not.supported"
        expect(response[:errors][0]["message"]).to eq "This route is not supported"
      end
    end
  end
end
