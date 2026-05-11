# frozen_string_literal: true

module MobileOtp
  class LoginChallenge
    RequestResult = Struct.new(:body, :status, keyword_init: true)
    VerificationResult = Struct.new(:company, :user, keyword_init: true)

    def self.request(phone:, company_id: nil)
      new(phone:, company_id:).request
    end

    def self.verify(pending_token:, code:)
      payload = ChallengeToken.verify(pending_token)

      new.verify(payload:, code:)
    end

    def initialize(phone: nil, company_id: nil)
      @phone = normalize_phone(phone)
      @company_id = company_id
    end

    def request
      return RequestResult.new(body: { error: "Phone is required" }, status: 422) if phone.blank?

      users = User.kept.where(phone:).includes(:employments, :roles)
      if users.empty?
        return RequestResult.new(body: { error: "No Miru customer login found for this phone" }, status: 404)
      end

      companies = companies_for(users)
      if companies.many? && company_id.blank?
        return RequestResult.new(
          body: {
            requires_workspace: true,
            workspaces: companies.map { |company| company.slice(:id, :name) }
          },
          status: 409
        )
      end

      company = selected_company(companies)
      user = users.detect { |current_user| current_user.employed_at?(company&.id) }
      unless company && user
        return RequestResult.new(body: { error: "No Miru customer login found for this workspace" }, status: 404)
      end

      result_body = issue_challenge(user:, company:)
      RequestResult.new(body: result_body, status: 202)
    rescue Msg91WidgetClient::Error => error
      Rails.logger.warn("MSG91 OTP request failed: #{error.message}")
      RequestResult.new(body: { error: error.message.presence || "Unable to send OTP" }, status: 422)
    end

    def verify(payload:, code:)
      valid =
        if payload["provider"] == "msg91_widget"
          verify_msg91_code(payload, code)
        else
          ChallengeToken.valid_code?(payload, code)
        end

      raise ChallengeToken::InvalidTokenError unless valid

      user = User.kept.find_by(id: payload.fetch("user_id"))
      company = Company.find_by(id: payload.fetch("company_id"))
      raise ChallengeToken::InvalidTokenError unless user && company && user.employed_at?(company.id)

      user.update!(current_workspace_id: company.id) if user.current_workspace_id != company.id
      VerificationResult.new(user:, company:)
    end

    private

      attr_reader :phone, :company_id

      def issue_challenge(user:, company:)
        if msg91_enabled?
          issue_msg91_challenge(user:, company:)
        else
          issue_internal_challenge(user:, company:)
        end
      end

      def issue_msg91_challenge(user:, company:)
        identifier = msg91_identifier(phone)
        response = Msg91WidgetClient.send_otp(identifier:)
        pending_token = ChallengeToken.issue(
          {
            "company_id" => company.id,
            "phone" => phone,
            "user_id" => user.id,
            "provider" => "msg91_widget",
            "req_id" => response.req_id,
            "identifier" => identifier
          }
        )

        {
          message: "OTP sent",
          otp_sent: true,
          pending_token:,
          expires_in: ChallengeToken::TTL.to_i
        }
      end

      def issue_internal_challenge(user:, company:)
        code = otp_code
        pending_token = ChallengeToken.issue(
          {
            "company_id" => company.id,
            "phone" => phone,
            "user_id" => user.id
          },
          code:
        )
        sms_sent = Delivery.deliver(phone:, code:, company:)

        {
          message: sms_sent ? "OTP sent" : "OTP generated",
          otp_sent: sms_sent,
          pending_token:,
          expires_in: ChallengeToken::TTL.to_i,
          test_code: Rails.env.test? ? code : nil
        }.compact
      end

      def verify_msg91_code(payload, code)
        response = Msg91WidgetClient.verify_otp(
          req_id: payload.fetch("req_id"),
          otp: code
        )

        return true if Msg91WidgetClient.token_auth.present?
        return false if response.access_token.blank?

        token_response = Msg91WidgetClient.verify_access_token(access_token: response.access_token)
        verified_identifier = msg91_identifier(token_response.identifier)
        expected_identifier = payload["identifier"].presence || msg91_identifier(payload["phone"])

        verified_identifier == expected_identifier
      end

      def msg91_enabled?
        Msg91WidgetClient.configured? && !Rails.env.test?
      end

      def companies_for(users)
        Company.where(id: users.flat_map { |user| user.employments.kept.pluck(:company_id) }.uniq).order(:name).to_a
      end

      def selected_company(companies)
        return companies.first if company_id.blank?

        companies.detect { |company| company.id == company_id.to_i }
      end

      def normalize_phone(phone)
        value = phone.to_s.strip
        return if value.blank?

        digits = value.gsub(/\D/, "")
        return "+91#{digits}" if digits.length == 10
        return "+#{digits}" if digits.start_with?("91") && digits.length == 12
        return "+#{digits}" if value.start_with?("+")

        digits
      end

      def msg91_identifier(value)
        value.to_s.gsub(/\D/, "")
      end

      def otp_code
        Rails.env.test? ? "123456" : SecureRandom.random_number(1_000_000).to_s.rjust(6, "0")
      end
  end
end
