# frozen_string_literal: true

module PayrollProviders
  module MercuryContract
    Request = Data.define(:request_id, :account_id, :recipient_id, :payment_method, :amount_minor, :status, :memo,
      :created_at, :scheduled_send_on, :approvers_required, :requester_may_approve)
    Transaction = Data.define(:id, :account_id, :request_id, :amount_minor, :status, :kind, :failure_reason)
    Recipient = Data.define(:id, :status, :name, :swift_code, :account_number, :ifsc_code)
    Account = Data.define(:id, :name, :account_mask, :legal_business_name, :status, :type)

    UUID = PayrollMercuryConnection::UUID
    REQUEST_STATUSES = PayrollPaymentInstruction::REQUEST_STATUSES
    TRANSACTION_STATUSES = PayrollPaymentInstruction::TRANSACTION_STATUSES
    PAYMENT_METHODS = %w[ach check domesticWire internationalWire realTimePayment].freeze
    FEE_KIND = "wireFee"
    OUTGOING_KIND = "outgoingPayment"

    module_function

    def send_money_request(value)
      hash = object(value)
      Request.new(
        request_id: uuid(hash["requestId"]), account_id: uuid(hash["accountId"]), recipient_id: uuid(hash["recipientId"]),
        payment_method: member(hash["paymentMethod"], PAYMENT_METHODS), amount_minor: minor_units(hash["amount"]),
        status: member(hash["status"], REQUEST_STATUSES), memo: optional_string(hash["memo"]), created_at: time(hash["createdAt"]),
        scheduled_send_on: optional_date(hash["scheduledSendDate"]),
        approvers_required: optional_integer(hash["numberOfApproversRequired"]),
        requester_may_approve: optional_boolean(hash["requesterMayApprove"])
      )
    end

    def send_money_requests(value)
      hash = object(value)
      requests = hash["requests"]
      malformed! unless requests.is_a?(Array)
      page = object(hash["page"])
      [requests.map { |entry| send_money_request(entry) }, page["nextPage"] && uuid(page["nextPage"])]
    end

    def request_id(value)
      candidate = value["requestId"] if value.is_a?(Hash)
      candidate if candidate.is_a?(String) && candidate.match?(UUID)
    end

    def transaction(value)
      hash = object(value)
      Transaction.new(
        id: string(hash["id"]), account_id: string(hash["accountId"]), request_id: optional_string(hash["requestId"]),
        amount_minor: minor_units(hash["amount"]), status: member(hash["status"], TRANSACTION_STATUSES),
        kind: string(hash["kind"]), failure_reason: optional_string(hash["reasonForFailure"])&.slice(0, 200)
      )
    end

    def transactions(value)
      hash = object(value)
      entries = hash["transactions"]
      total = hash["total"]
      malformed! unless entries.is_a?(Array) && total.is_a?(Integer)
      [entries.map { |entry| transaction(entry) }, total]
    end

    def recipient(value)
      hash = object(value)
      routing = hash["internationalWireRoutingInfo"]
      routing = {} unless routing.is_a?(Hash)
      india = routing.dig("countrySpecific", "india")
      Recipient.new(
        id: uuid(hash["id"]), status: member(hash["status"], %w[active deleted]), name: string(hash["name"]),
        swift_code: optional_string(routing["swiftCode"]), account_number: optional_string(routing["iban"]),
        ifsc_code: india.is_a?(Hash) ? optional_string(india["ifscCode"]) : nil
      )
    end

    def account(value)
      hash = object(value)
      Account.new(
        id: uuid(hash["id"]), name: string(hash["name"]), account_mask: string(hash["accountNumber"]).last(4),
        legal_business_name: string(hash["legalBusinessName"]), status: string(hash["status"]), type: string(hash["type"])
      )
    end

    def object(value)
      value.is_a?(Hash) ? value : malformed!
    end

    def string(value)
      value.is_a?(String) && !value.empty? ? value : malformed!
    end

    def optional_string(value)
      value.nil? ? nil : string(value)
    end

    def uuid(value)
      value.is_a?(String) && value.match?(UUID) ? value : malformed!
    end

    def member(value, allowed)
      allowed.include?(value) ? value : malformed!
    end

    def minor_units(value)
      malformed! unless value.is_a?(Integer) || value.is_a?(BigDecimal)
      minor = value * 100
      malformed! unless minor.finite? && minor == minor.to_i
      minor.to_i
    end

    def time(value)
      Time.iso8601(string(value))
    rescue ArgumentError
      malformed!
    end

    def optional_date(value)
      value.nil? ? nil : Date.iso8601(string(value))
    rescue Date::Error
      malformed!
    end

    def optional_integer(value)
      value.nil? || value.is_a?(Integer) ? value : malformed!
    end

    def optional_boolean(value)
      [nil, true, false].include?(value) ? value : malformed!
    end

    def malformed!
      raise MercuryClient::Malformed, "Mercury response is malformed"
    end
  end
end
