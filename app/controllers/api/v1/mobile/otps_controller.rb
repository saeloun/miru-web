# frozen_string_literal: true

class Api::V1::Mobile::OtpsController < Api::V1::ApplicationController
  include AuthResponsePayload

  skip_before_action :authenticate_user!
  skip_before_action :authenticate_user_using_x_auth_token
  skip_before_action :set_virtual_verified_invitations_allowed

  def create
    skip_authorization

    phone = normalize_phone(otp_params[:phone])
    return render json: { error: "Phone is required" }, status: 422 if phone.blank?

    users = User.kept.where(phone:).includes(:employments, :roles)
    return render json: { error: "No Miru customer login found for this phone" }, status: 404 if users.empty?

    companies = companies_for(users)
    if companies.many? && otp_params[:company_id].blank?
      return render json: {
        requires_workspace: true,
        workspaces: companies.map { |company| company.slice(:id, :name) }
      }, status: 409
    end

    company = selected_company(companies)
    user = users.detect { |current_user| current_user.employed_at?(company&.id) }
    return render json: { error: "No Miru customer login found for this workspace" }, status: 404 unless company && user

    code = otp_code
    pending_token = MobileOtp::ChallengeToken.issue(
      {
        "company_id" => company.id,
        "phone" => phone,
        "user_id" => user.id
      },
      code:
    )
    sms_sent = MobileOtp::Delivery.deliver(phone:, code:, company:)

    render json: {
      message: sms_sent ? "OTP sent" : "OTP generated",
      otp_sent: sms_sent,
      pending_token:,
      expires_in: MobileOtp::ChallengeToken::TTL.to_i,
      test_code: Rails.env.test? ? code : nil
    }.compact, status: 202
  end

  def verify
    skip_authorization

    payload = MobileOtp::ChallengeToken.verify(otp_params[:pending_token])
    return render json: { error: "Invalid OTP" }, status: 422 unless MobileOtp::ChallengeToken.valid_code?(payload, otp_params[:code])

    user = User.kept.find(payload.fetch("user_id"))
    company = Company.find(payload.fetch("company_id"))
    return render json: { error: "No Miru customer login found for this workspace" }, status: 404 unless user.employed_at?(company.id)

    user.update!(current_workspace_id: company.id) if user.current_workspace_id != company.id
    sign_in user, store: false

    render json: {
      notice: I18n.t("devise.sessions.signed_in"),
      **mobile_signed_in_payload(user, company:)
    }, status: 200
  rescue MobileOtp::ChallengeToken::InvalidTokenError, KeyError
    render json: { error: "OTP expired. Request a new code." }, status: 422
  end

  private

    def otp_params
      params.permit(:phone, :company_id, :pending_token, :code)
    end

    def companies_for(users)
      Company.where(id: users.flat_map { |user| user.employments.kept.pluck(:company_id) }.uniq).order(:name).to_a
    end

    def selected_company(companies)
      return companies.first if otp_params[:company_id].blank?

      companies.detect { |company| company.id == otp_params[:company_id].to_i }
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

    def otp_code
      Rails.env.test? ? "123456" : SecureRandom.random_number(1_000_000).to_s.rjust(6, "0")
    end
end
