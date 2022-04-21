# frozen_string_literal: true

class Wise::PayoutApi
  include HTTParty
  base_uri WISE_API_URL

  # Sandbox URL: https://sandbox.transferwise.tech/
  # Account email: sharang.d+test1@gmail.com

  # Wise::PayoutApi.new.get_profile_details
  def get_profile_details
    self.class.get(
      "/v1/profiles", headers: {
        "Authorization" => "Bearer #{WISE_API_KEY}"
      })
  end

  # To USD
  # Wise::PayoutApi.new.create_quote(target_currency: "USD", amount: 123)["id"]
  #
  # To another currency
  # Wise::PayoutApi.new.create_quote(target_currency: "GBP", amount: 111)["id"]
  def create_quote(amount:, target_currency:)
    amount_info = if target_currency == "USD"
      {
        sourceAmount: nil,
        targetAmount: amount
      }
    else
      {
        sourceAmount: amount,
        targetAmount: nil
      }
    end
    body = {
      sourceCurrency: "USD",
      targetCurrency: target_currency,
      profile: WISE_PROFILE_ID,
      preferredPayIn: "BALANCE"
    }.merge(amount_info)

    self.class.post(
      "/v2/quotes", headers: {
        "Authorization" => "Bearer #{WISE_API_KEY}",
        "Content-Type" => "application/json"
      }, body: body.to_json)
  end

  # GET https://api.sandbox.transferwise.tech/v1/account-requirements?source=USD&target=GBP&sourceAmount=1000
  # Wise::PayoutApi.new.create_recipient_account
  # {"id":148323208,"business":null,"profile":16421159,"accountHolderName":"Ann Johnson","currency":"GBP","country":"GB","type":"sort_code","details":{"address":{"country":"GB","countryCode":"GB","firstLine":"112 2nd street","postCode":"SW1P 3","city":"London","state":null},"email":"someone@somewhere.com","legalType":"PRIVATE","accountHolderName":null,"accountNumber":"28821822","sortCode":"231470","abartn":null,"accountType":null,"bankgiroNumber":null,"ifscCode":null,"bsbCode":null,"institutionNumber":null,"transitNumber":null,"phoneNumber":null,"bankCode":null,"russiaRegion":null,"routingNumber":null,"branchCode":null,"cpf":null,"cardToken":null,"idType":null,"idNumber":null,"idCountryIso3":null,"idValidFrom":null,"idValidTo":null,"clabe":null,"swiftCode":null,"dateOfBirth":null,"clearingNumber":null,"bankName":null,"branchName":null,"businessNumber":null,"province":null,"city":null,"rut":null,"token":null,"cnpj":null,"payinReference":null,"pspReference":null,"orderId":null,"idDocumentType":null,"idDocumentNumber":null,"targetProfile":null,"targetUserId":null,"taxId":null,"job":null,"nationality":null,"interacAccount":null,"bban":null,"town":null,"postCode":null,"language":null,"billerCode":null,"customerReferenceNumber":null,"prefix":null,"IBAN":null,"iban":null,"BIC":null,"bic":null},"user":5940326,"active":true,"ownedByCustomer":false}
  def create_recipient_account(recipient)
    self.class.post(
      "/v1/accounts", headers: {
        "Authorization" => "Bearer #{WISE_API_KEY}",
        "Content-Type" => "application/json"
      }, body: recipient.to_json)
  end

  # Wise::PayoutApi.new.create_swift_recipient_account
  def create_swift_recipient_account
    self.class.post(
      "/v1/accounts", headers: {
        "Authorization" => "Bearer #{WISE_API_KEY}",
        "Content-Type" => "application/json"
      }, body: {
        currency: "USD",
        type: "swift_code",
        profile: WISE_PROFILE_ID,
        accountHolderName: "Swift Johnson",
        legalType: "PRIVATE",
        details: {
          legalType: "PRIVATE",
          email: "swift@somewhere.com",
          accountHolderName: "swift somewhere",
          swiftCode: "BUKBGB22",
          accountNumber: 123456789012,
          address: {
            country: "IN",
            city: "Pune",
            firstLine: "22 2nd street",
            postCode: "411005"
          }
        }
      }.to_json)
  end

  # Wise::PayoutApi.new.create_transfer(quote_id: "099e335c-f53c-442f-9dab-e3ca96c2844e", recipient_id: 148202368, unique_transaction_id: SecureRandom.uuid)
  def create_transfer(quote_id:, recipient_id:, unique_transaction_id:)
    self.class.post(
      "/v1/transfers", headers: {
        "Authorization" => "Bearer #{WISE_API_KEY}",
        "Content-Type" => "application/json"
      }, body: {
        targetAccount: recipient_id,
        quoteUuid: quote_id,
        customerTransactionId: unique_transaction_id,
        details: {
          reference: "to my friend",
          transferPurpose: "verification.transfers.purpose.pay.bills",
          sourceOfFunds: "verification.source.of.funds.other"
        }
      }.to_json)
  end

  # Wise::PayoutApi.new.fund_transfer(transfer_id: "50500593")
  def fund_transfer(transfer_id:)
    self.class.post(
      "/v3/profiles/#{WISE_PROFILE_ID}/transfers/#{transfer_id}/payments", headers: {
        "Authorization" => "Bearer #{WISE_API_KEY}",
        "Content-Type" => "application/json"
      }, body: {
        type: "BALANCE"
      }.to_json)
  end

  # Wise::PayoutApi.new.delivery_estimate(transfer_id: "50500593")
  def delivery_estimate(transfer_id:)
    self.class.get(
      "/v1/delivery-estimates/#{transfer_id}", headers: {
        "Authorization" => "Bearer #{WISE_API_KEY}"
      })
  end

  # Wise::PayoutApi.new.get_balance(profile_id: "16356035")
  # Wise::PayoutApi.new.get_balance
  def get_balance(profile_id: WISE_PROFILE_ID)
    self.class.get(
      "/v1/borderless-accounts?profileId=#{profile_id}", headers: {
        "Authorization" => "Bearer #{WISE_API_KEY}"
      })
  end

  # Wise::PayoutApi.new.get_transfer(transfer_id: "50500593")
  def get_transfer(transfer_id:)
    self.class.get(
      "/v1/transfers/#{transfer_id}", headers: {
        "Authorization" => "Bearer #{WISE_API_KEY}"
      })
  end
end
