# frozen_string_literal: true

class Invitations::AcceptController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  before_action :private_headers

  rescue_from ActionController::InvalidAuthenticityToken do
    @error = "The confirmation page expired. Open your original invitation link and try again."
    render :index, layout: false, status: 422
  end

  def index
    @invitation = Invitation.find_by(token: invitation_token)
    if !@invitation&.is_valid?
      @error = "This invitation is expired or has already been accepted. Ask your workspace admin for a new invitation."
      status = :gone
    elsif current_user && current_user.email != @invitation.recipient_email
      @error = "You are already signed in. Sign out of the other account, then open your invitation link again."
      status = :forbidden
    end
    render :index, layout: false, status: status || :ok
  end

  def create
    service = CreateInvitedUserService.new(invitation_token, current_user)
    service.process

    if service.success
      flash[:success] = t("invitations.accept.index.success")
      if service.new_user
        return redirect_to edit_user_password_path(reset_password_token: service.reset_password_token)
      end
      return redirect_to(current_user ? root_path : new_user_session_path)
    end
    @error = service.error_message
    @error += " Sign out of the other account, then open your invitation link again." if current_user && service.error.is_a?(CreateInvitedUserService::InvalidInvitaion)
    render :index, layout: false, status: 422
  end

  def show
    redirect_to root_path, notice: t(".success")
  end

  private

    def invitation_token
      value = params[:token] || params[:invitation_token]
      value if value.is_a?(String) && value.bytesize.between?(1, 128)
    end

    def private_headers
      response.headers.merge!("Cache-Control" => "private, no-store", "Referrer-Policy" => "no-referrer",
        "X-Robots-Tag" => "noindex, nofollow", "X-Frame-Options" => "DENY")
    end
end
