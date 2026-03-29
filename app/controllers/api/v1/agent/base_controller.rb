# frozen_string_literal: true

class Api::V1::Agent::BaseController < Api::V1::ApplicationController
  skip_before_action :authenticate_user_using_x_auth_token
  skip_before_action :authenticate_user!
  skip_before_action :set_virtual_verified_invitations_allowed
  skip_after_action :verify_authorized

  before_action :authenticate_agent_key!
  before_action :set_agent_current_details!

  private

    def authenticate_agent_key!
      agent_key = AgentKey.authenticate(bearer_token)
      return render_unauthorized unless agent_key

      @current_agent_key = agent_key
      @current_agent = agent_key.agent
      sign_in @current_agent.user, store: false
      current_user.current_workspace = @current_agent.company
    end

    def set_agent_current_details!
      Current.user = current_user
      Current.company = current_company
    end

    def bearer_token
      request.headers["Authorization"].to_s.delete_prefix("Bearer ").presence
    end

    def render_unauthorized
      render json: { error: I18n.t("devise.failure.unauthenticated") }, status: 401
    end

    attr_reader :current_agent

    attr_reader :current_agent_key

    def current_company
      current_agent&.company || super
    end
end
