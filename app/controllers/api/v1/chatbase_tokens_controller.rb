# frozen_string_literal: true

class Api::V1::ChatbaseTokensController < Api::V1::BaseController
  skip_before_action :authenticate_user!, only: [:show]

  def show
    if current_user
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
    else
      head 401
    end
  end
end
