# frozen_string_literal: true

class Api::V1::SignatureOperationsController < Api::V1::SignatureRequestsController
  ACTIONS = { "send" => :send_request, "cancel" => :cancel, "remind" => :remind, "refresh" => :refresh }.freeze

  def create
    record = company_requests.find(params[:signature_request_id])
    authorize record, :update?
    attributes = payload(%w[company_id lock_version revision_id content_digest kind provider_envelope_id])
    return unless current_agreement_workspace?(attributes)

    action = ACTIONS[attributes[:kind]]
    raise ActionController::BadRequest unless action && (action == :refresh || !attributes.key?(:provider_envelope_id))

    operation = Signatures::Operations.new(record, actor: current_user, attributes:).public_send(action)
    record.reload
    render json: { operation: operation.summary, signature_request: details(record, record.current_revision) },
      status: operation.state == "queued" ? :accepted : :ok
  end
end
