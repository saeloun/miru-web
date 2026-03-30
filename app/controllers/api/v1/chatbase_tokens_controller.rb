# frozen_string_literal: true

class Api::V1::ChatbaseTokensController < Api::V1::BaseController
  skip_after_action :verify_authorized, only: [:show]

  def show
    return head 401 unless current_user

    token = JWT.encode(
      {
        user_id: current_user.id,
        email: current_user.email,
        name: current_user.full_name,
        company: current_user.current_workspace&.name,
        exp: 1.hour.from_now.to_i
      },
      ENV["CHATBASE_IDENTITY_SECRET"],
      "HS256"
    )

    render json: { token: }
  end
end
