# frozen_string_literal: true

class Api::V1::Agent::CapabilitiesController < Api::V1::Agent::BaseController
  def show
    render json: {
      agent: {
        id: current_agent.id,
        name: current_agent.name,
        provider: current_agent.provider,
        active: current_agent.active
      },
      commands: [
        {
          name: "time create",
          description: "Create a reviewable agent timesheet entry for the authenticated agent key",
          requires_review: true,
          supports_source_metadata: true,
          supports_proof_metadata: true
        }
      ]
    }, status: 200
  end
end
