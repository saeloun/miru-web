# frozen_string_literal: true

class V1::SessionsController < ApplicationController
  skip_before_action :authenticate_request, only: [:create]
  skip_before_action :verify_authenticity_token

  def create
    command = Authentication::AuthenticateUser.process(params[:email], params[:password])

    if command.success?
      render json: { auth_token: command.result }
    else
      render json: { error: command.errors }, status: :unauthorized
    end
  end

  def destroy
    command = Authentication::DestroyUser.process(current_user)

    if command.success?
      render json: { message: command.result }
    else
      render json: { error: command.errors }, status: :unauthorized
    end
  end
end
