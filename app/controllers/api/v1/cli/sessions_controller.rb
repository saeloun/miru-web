# frozen_string_literal: true

class Api::V1::Cli::SessionsController < Api::V1::Cli::BaseController
  def destroy
    skip_authorization

    current_cli_session&.revoke!

    render json: { notice: "CLI session revoked" }, status: 200
  end
end
