# frozen_string_literal: true

class Api::V1::SignatureConnectionsController < Api::V1::ApplicationController
  include AgreementAuthoring

  rescue_from SignatureConnection::Conflict do |error|
    render json: { errors: error.message }, status: 409
  end
  rescue_from ActionController::ParameterMissing, ActionController::BadRequest do
    render json: { errors: "Invalid signing connection parameters" }, status: 400
  end
  rescue_from Signatures::DocumensoClient::ConfigurationError, Signatures::DocumensoClient::Unavailable do |error|
    render json: { errors: error.message }, status: 503
  end
  rescue_from Signatures::DocumensoClient::Rejected do |error|
    render json: { errors: error.message }, status: 422
  end

  def show
    authorize SignatureConnection, :index?
    connection = SignatureConnection.active.find_by(company: current_company)
    render json: { signature_connection: metadata(connection) }
  end

  def create
    authorize SignatureConnection, :create?
    attributes = payload
    return unless current_agreement_workspace?(attributes)

    client = Signatures::DocumensoClient.new(api_key: attributes[:api_key])
    client.check_connection
    connection = SignatureConnection.new(company: current_company, created_by: current_user,
      api_key: attributes[:api_key], provider_origin: client.origin)
    current_user.with_lock do
      authorize connection, :update?
      connection.activate!(previous_id: attributes[:previous_id])
    end
    render json: { signature_connection: metadata(connection) }, status: 201
  end

  private

    def payload
      value = params.require(:signature_connection)
      unless value.is_a?(ActionController::Parameters) && (value.keys - %w[company_id previous_id api_key]).empty? &&
          value[:api_key].is_a?(String) && value[:api_key].bytesize.between?(1, 4096) &&
          (value[:previous_id].nil? || value[:previous_id].is_a?(Integer) && value[:previous_id].positive?)
        raise ActionController::BadRequest
      end
      value.to_unsafe_h.symbolize_keys
    end

    def metadata(connection)
      origin = configured_origin
      { id: connection&.id, configured: connection.present? && connection.provider_origin == origin,
        server_configured: origin.present?, connected_at: connection&.created_at }
    end

    def configured_origin
      Signatures::DocumensoClient.new(api_key: "configuration-check").origin
    rescue Signatures::DocumensoClient::ConfigurationError
      nil
    end
end
