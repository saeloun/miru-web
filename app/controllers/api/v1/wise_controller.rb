# frozen_string_literal: true

class Api::V1::WiseController < Api::V1::ApplicationController
  before_action :authenticate_user!
  after_action :verify_authorized

  def fetch_bank_requirements
    authorize :wise, :show?

    requirements = {
      fields: [
        { key: "account_number", label: "Account Number", required: true },
        { key: "routing_number", label: "Routing Number", required: true },
        { key: "account_holder_name", label: "Account Holder Name", required: true }
      ]
    }

    render json: { requirements: requirements }
  end

  def validate_account_details
    authorize :wise, :show?

    # Mock validation
    valid = params[:account_number].present? && params[:routing_number].present?

    render json: { valid: valid, errors: valid ? [] : ["Invalid account details"] }
  end
end
