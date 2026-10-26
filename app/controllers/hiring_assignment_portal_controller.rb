# frozen_string_literal: true

class HiringAssignmentPortalController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :private_headers
  before_action :find_assignment, except: :show

  rescue_from ActionController::InvalidAuthenticityToken do
    render json: { errors: "The page expired. Open your original assignment link to try again." }, status: 422
  end
  rescue_from HiringAssignment::Unavailable do
    render json: { errors: "This assignment link is unavailable. Ask the hiring team for a new link." }, status: 410
  end
  rescue_from ActionController::BadRequest, ActionController::ParameterMissing do
    render json: { errors: "Invalid assignment request." }, status: 400
  end
  rescue_from ::Hiring::Intake::InvalidInput, ActiveRecord::RecordInvalid do |error|
    message = error.is_a?(::Hiring::Intake::InvalidInput) ? error.message : "Use valid assignment details."
    render json: { errors: message }, status: 422
  end
  rescue_from ::Hiring::Intake::Conflict, ActiveRecord::StaleObjectError do
    render json: { errors: "This assignment changed. Reload it before saving again." }, status: 409
  end
  rescue_from HiringSubmission::StorageUnavailable, IOError, SystemCallError do
    render json: { errors: "Private file storage is unavailable. Please try again." }, status: 503
  end
  rescue_from ActiveStorage::FileNotFoundError, ActiveRecord::RecordNotFound do
    render json: { errors: "File unavailable." }, status: 404
  end

  def show
    render :show, layout: false
  end

  def open
    with_access { render_assignment }
  end

  def submit
    service.submit!(assignment: @assignment, token: @token, attributes: @attributes.except("token"))
    with_access { render_assignment }
  end

  def upload
    attributes = @attributes.except("token")
    %w[assignment_version submission_version].each do |key|
      value = attributes[key]
      raise ActionController::BadRequest unless value.is_a?(String) && value.match?(/\A(?:0|[1-9]\d{0,8})\z/)

      attributes[key] = value.to_i
    end
    service.upload!(assignment: @assignment, token: @token, attributes:)
    with_access { render_assignment }
  end

  def remove_file
    service.remove_file!(assignment: @assignment, token: @token, attributes: @attributes.except("token"))
    with_access { render_assignment }
  end

  def download
    with_access do
      file = service.candidate_file!(assignment: @assignment, token: @token, attachment_id: @attributes["attachment_id"])
      response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
      send_data file.fetch(:data), filename: file.fetch(:filename), type: file.fetch(:type), disposition: "attachment"
    end
  end

  private

    def private_headers
      response.headers.merge!("Cache-Control" => "private, no-store", "Referrer-Policy" => "no-referrer",
        "X-Content-Type-Options" => "nosniff", "X-Robots-Tag" => "noindex, nofollow", "X-Frame-Options" => "DENY")
    end

    def find_assignment
      value = params.require(:hiring_assessment)
      allowed = { "open" => %w[token], "submit" => %w[token assignment_version submission_version answers],
        "upload" => %w[token assignment_version submission_version file],
        "remove_file" => %w[token assignment_version submission_version attachment_id], "download" => %w[token attachment_id] }.fetch(action_name)
      raise ActionController::BadRequest unless value.is_a?(ActionController::Parameters) && (value.keys - allowed).empty?

      @attributes = value.to_unsafe_h
      @token = @attributes["token"]
      raise HiringAssignment::Unavailable unless @token.is_a?(String) && @token.match?(HiringPortalAccess::TOKEN)

      @assignment = HiringAssignment.find_by(access_token: @token)
      raise HiringAssignment::Unavailable unless @assignment
    end

    def with_access
      @assignment.hiring_application.with_lock do
        @assignment.with_lock do
          raise HiringAssignment::Unavailable unless @assignment.candidate_access?(@token)

          yield
        end
      end
    end

    def service = ::Hiring::Assignments.new(application: @assignment.hiring_application, actor: nil)

    def render_assignment
      raise HiringAssignment::Unavailable unless @assignment.candidate_access?(@token)

      render json: { assignment: @assignment.candidate_details }
    end
end
