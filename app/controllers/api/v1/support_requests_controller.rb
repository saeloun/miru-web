# frozen_string_literal: true

class Api::V1::SupportRequestsController < Api::V1::ApplicationController
  MAX_REQUESTS_PER_HOUR = 5

  def create
    authorize current_company, :support_request?

    subject = support_request_params[:subject].to_s.delete("\r\n").strip
    message = support_request_params[:message].to_s.delete("\r\n").strip
    return render_validation_error if subject.blank? || message.blank? || subject.length > 200 || message.length > 5000
    return render_throttled if throttle_count > MAX_REQUESTS_PER_HOUR

    SupportRequestMailer.with(
      user_id: current_user.id,
      workspace_name: current_company.name,
      plan_label: current_company.current_plan_label,
      seat_count: current_company.used_team_seats,
      role: current_user.roles.find_by(resource: current_company)&.name || "member",
      subject:,
      message:,
      priority: current_company.pro_access?
    ).request.deliver_later
    Analytics::TrackingService.new(user: current_user).track_support_request(current_company)

    head 201
  end

  private

    def support_request_params
      params.require(:support_request).permit(:subject, :message)
    end

    def throttle_count
      Rails.cache.increment("support_requests:user:#{current_user.id}", 1, expires_in: 1.hour).to_i
    end

    def render_validation_error
      render json: { errors: "Subject and message are required and must fit the allowed lengths." }, status: 422
    end

    def render_throttled
      render json: { errors: "You can send up to 5 support requests per hour." }, status: 429
    end
end
