# frozen_string_literal: true

module Payroll
  class MercurySetup
    BANK_FIELDS = %w[bank_account_name bank_name bank_country bank_account_currency bank_account_number bank_ifsc bank_swift].freeze
    Contract = PayrollProviders::MercuryContract

    def self.digest(values)
      key = Rails.application.key_generator.generate_key("payroll_mercury_digest", 32)
      OpenSSL::HMAC.hexdigest("SHA256", key, JSON.generate(values))
    end

    # Returns the full declared identity for verification digests, omitting blanks without inventing defaults.
    def self.bank_details(employment, beneficiary = "consultant", arrangement: nil)
      return (arrangement&.bank_details || {}) if beneficiary == "spouse"

      (employment.employee_record&.private_details || {}).slice(*EmployeeRecord::BANK_KEYS).compact_blank
    end

    def self.bank_profile_complete?(details)
      BANK_FIELDS.all? { |field| details[field].is_a?(String) && details[field].strip.length.between?(1, 200) } &&
        EmployeeRecord.supported_country?(details["bank_country"]) && EmployeeRecord.supported_currency?(details["bank_account_currency"])
    end

    def self.recipient_digest(recipient)
      digest(recipient.to_h.slice(:id, :status, :name, :swift_code, :account_number, :ifsc_code).transform_keys(&:to_s).sort.to_h)
    end

    def initialize(company)
      @company = company
    end

    def save!(actor:, attributes:)
      authorize!(actor)
      connection = PayrollMercuryConnection.find_or_initialize_by(company_id: @company.id)
      connection.assign_attributes(attributes.compact_blank.merge(configured_by: actor))
      connection.save!
      connection
    end

    def verify!(actor:)
      authorize!(actor)
      connection = PayrollMercuryConnection.find_by!(company_id: @company.id)
      account = read_account!(connection)
      connection.update!(verified_at: Time.current, verified_version: connection.credential_version, verified_by: actor,
        verified_account_name: account.name, verified_account_mask: account.account_mask)
      connection
    rescue MercuryPayment::Blocked
      connection&.update!(verified_at: nil, verified_version: nil, verified_by: nil, verified_account_name: nil, verified_account_mask: nil)
      raise
    end

    def link_recipient!(actor:, employment_id:, recipient_id:, beneficiary: "consultant")
      authorize!(actor)
      connection = verified_connection!
      employment = Employment.kept.where(company_id: @company.id).find(employment_id)
      blocked!("recipient_id_invalid") unless recipient_id.is_a?(String) && recipient_id.match?(PayrollMercuryConnection::UUID)
      blocked!("beneficiary_invalid") unless PayrollMercuryRecipientLink::BENEFICIARIES.include?(beneficiary)

      arrangement = active_arrangement!(employment, beneficiary)
      details = self.class.bank_details(employment, beneficiary, arrangement:)
      blocked!("bank_profile_incomplete") unless self.class.bank_profile_complete?(details)

      recipient = read_recipient!(connection, recipient_id)
      codes = recipient_mismatches(recipient, details)
      raise MercuryPayment::Blocked.new(codes) if codes.any?

      persist_link(actor, employment, recipient, beneficiary, details, arrangement)
    end

    private

      def authorize!(actor)
        Entitlement.require!(@company.id)
        eligible = actor&.persisted? && User.kept.exists?(id: actor.id, current_workspace_id: @company.id) &&
          Employment.kept.where(user_id: actor.id, company_id: @company.id, joined_at: ..Date.current)
            .where("resigned_at IS NULL OR resigned_at >= ?", Date.current).exists? &&
          actor.roles.where(resource: @company, name: "owner").exists?
        raise Workflow::NotAuthorized, "An active owner in this workspace is required" unless eligible
      end

      def active_arrangement!(employment, beneficiary)
        return nil unless beneficiary == "spouse"

        current = PayrollSplitArrangement.current_for(employment)
        blocked!("split_pending_approval") unless current&.active?
        current
      end

      def verified_connection!
        connection = PayrollMercuryConnection.find_by(company_id: @company.id)
        blocked!("connection_unverified") unless connection&.read_verified?
        connection
      end

      def read_account!(connection)
        account = read_account(connection)
        unless account.id == connection.source_account_id && account.legal_business_name == connection.expected_legal_business_name
          blocked!("source_account_ineligible")
        end
        connection.balance_adapter.fetch_balance(company_id: @company.id, currency: "USD")
        account
      rescue PayrollProviders::Error
        blocked!("source_account_ineligible")
      end

      def read_account(connection)
        Contract.account(connection.client.account(connection.source_account_id))
      rescue PayrollProviders::MercuryClient::Rejected, PayrollProviders::MercuryClient::Ambiguous
        blocked!("mercury_read_failed")
      end

      def read_recipient!(connection, recipient_id)
        Contract.recipient(connection.client.recipient(recipient_id))
      rescue PayrollProviders::Error
        blocked!("recipient_check_failed")
      end

      def recipient_mismatches(recipient, details)
        return ["recipient_inactive"] unless recipient.status == "active"
        return ["recipient_not_international_wire"] unless recipient.swift_code && recipient.account_number && recipient.ifsc_code

        codes = []
        codes << "recipient_swift_mismatch" unless normalized(recipient.swift_code) == normalized(details["bank_swift"])
        codes << "recipient_ifsc_mismatch" unless normalized(recipient.ifsc_code) == normalized(details["bank_ifsc"])
        codes << "recipient_account_mismatch" unless normalized(recipient.account_number) == normalized(details["bank_account_number"])
        codes << "recipient_name_mismatch" unless normalized(recipient.name) == normalized(details["bank_account_name"])
        codes
      end

      def normalized(value)
        value.to_s.gsub(/\s+/, "").upcase
      end

      def persist_link(actor, employment, recipient, beneficiary, details, arrangement)
        recipient_digest = self.class.recipient_digest(recipient)
        bank_details_digest = self.class.digest(details.sort.to_h)
        current = PayrollMercuryRecipientLink.current_for(employment, beneficiary)
        return current if current && current.recipient_digest == recipient_digest && current.bank_details_digest == bank_details_digest &&
          current.split_arrangement_id == arrangement&.id

        PayrollMercuryRecipientLink.create!(company_id: @company.id, employment:, beneficiary:, split_arrangement: arrangement, verified_by: actor,
          mercury_recipient_id: recipient.id, recipient_digest:, bank_details_digest:, display_name: recipient.name,
          account_mask: recipient.account_number.last(4), swift_code: recipient.swift_code)
      end

      def blocked!(*codes)
        raise MercuryPayment::Blocked.new(codes)
      end
  end
end
