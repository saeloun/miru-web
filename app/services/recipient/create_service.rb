# frozen_string_literal: true

class Recipient::CreateService
  def initialize(user:, recipient_account_params:)
    @user = user
    @recipient_account_params = recipient_account_params
  end

  def process
    recipient_response = Wise::PayoutApi.new.create_recipient_account(@recipient_account_params)
    if !recipient_response["errors"].nil?
      return { errors: recipient_response["errors"] }
    end

    recipient_attributes = parse_recipient_from_response(recipient_response)
    recipient_attributes
  end

  private

    def parse_recipient_from_response(response)
      account_details = response["details"]
      {
        recipient_id: response["id"],
        bank_name: account_details["bankName"],
        currency: response["currency"],
        last_four_digits: account_details["accountNumber"].last(4)
      }
    end
end
