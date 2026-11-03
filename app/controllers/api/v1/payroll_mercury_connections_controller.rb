# frozen_string_literal: true

class Api::V1::PayrollMercuryConnectionsController < Api::V1::PayrollBaseController
  def update
    authorize_connection
    setup.save!(actor: current_user, attributes: connection_params.to_h.symbolize_keys)
    render json: { saved: true }
  end

  def verify
    authorize_connection
    setup.verify!(actor: current_user)
    render json: { verified: true }
  rescue ActiveRecord::RecordNotFound
    render json: { errors: "Save the Mercury connection first" }, status: 422
  end

  def recipients
    authorize_connection
    link = setup.link_recipient!(actor: current_user, employment_id: params[:employment_id], recipient_id: params[:recipient_id],
      beneficiary: params[:beneficiary].presence || "consultant")
    render json: { recipient: { name: link.display_name, account_mask: link.account_mask, swift_code: link.swift_code } }, status: 201
  end

  private

    def authorize_connection
      authorize PayrollRun, :manage_mercury_connection?
    end

    def setup
      Payroll::MercurySetup.new(Company.find(payroll_workspace_id))
    end

    def connection_params
      params.expect(payroll_mercury_connection: [:api_token, :environment, :source_account_id, :expected_legal_business_name, :wire_fee_minor])
    end
end
