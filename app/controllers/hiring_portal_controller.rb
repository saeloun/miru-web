# frozen_string_literal: true

class HiringPortalController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :private_headers
  before_action :find_access, except: :show

  rescue_from ActionController::InvalidAuthenticityToken do
    render json: { errors: "The form page expired. Open your original link to try again." }, status: 422
  end
  rescue_from HiringPortalAccess::Unavailable do
    render json: { errors: "This application link is unavailable. Ask the hiring team for a new link." }, status: 410
  end
  rescue_from ActionController::BadRequest, ActionController::ParameterMissing do
    render json: { errors: "Invalid application form request." }, status: 400
  end
  rescue_from ActiveRecord::RecordInvalid do
    render json: { errors: "Complete required fields and use valid amounts, currencies, dates and links." }, status: 422
  end
  rescue_from HiringSubmission::InvalidResume do
    render json: { errors: "Upload a PDF, DOC or DOCX resume up to 5 MiB." }, status: 422
  end
  rescue_from HiringSubmission::StorageUnavailable, IOError, SystemCallError do
    render json: { errors: "Private resume storage is unavailable. Please try again." }, status: 503
  end
  rescue_from ActiveStorage::FileNotFoundError do
    render json: { errors: "Resume unavailable." }, status: 404
  end
  rescue_from ::Hiring::Intake::Conflict, ActiveRecord::StaleObjectError do
    render json: { errors: "This form changed. Refresh it before submitting again." }, status: 409
  end

  def show
    render :show, layout: false
  end

  def open
    with_access { render_form }
  end

  def submit
    with_access do
      submission = @access.hiring_submission
      answers = @attributes["answers"]
      raise ActionController::BadRequest unless answers.is_a?(Hash)

      if submission.submitted_at?
        raise ::Hiring::Intake::Conflict, "A submitted form cannot be rewritten." unless submission.answers == answers
      else
        unless @attributes["lock_version"].is_a?(Integer) && submission.lock_version == @attributes["lock_version"]
          raise ::Hiring::Intake::Conflict, "The application form changed."
        end
        submission.update!(answers:, submitted_at: Time.current)
      end
      render_form
    end
  end

  def resume
    blob = nil
    with_access do
      submission = @access.hiring_submission
      version = @attributes["lock_version"]
      unless version.is_a?(String) && version.match?(/\A(?:0|[1-9]\d{0,8})\z/) && submission.lock_version == version.to_i && !submission.submitted_at?
        raise ::Hiring::Intake::Conflict, "The application form changed."
      end
      upload = @attributes["file"]
      blob = resume_blob(upload)
      upload.tempfile.rewind
      blob.upload(upload.tempfile, identify: false)
      submission.resume.attach(blob)
      submission.touch
      render_form
    end
  rescue StandardError
    if blob && !blob.attachments.exists?
      blob.persisted? ? blob.purge : blob.delete
    end
    raise
  end

  def resume_download
    with_access do
      submission = @access.hiring_submission
      data = submission.resume_bytes
      response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
      send_data data, filename: submission.resume.filename.to_s, type: submission.resume.blob.content_type, disposition: "attachment"
    end
  end

  private

    def private_headers
      response.headers.merge!("Cache-Control" => "private, no-store", "Referrer-Policy" => "no-referrer",
        "X-Content-Type-Options" => "nosniff", "X-Robots-Tag" => "noindex, nofollow", "X-Frame-Options" => "DENY")
    end

    def find_access
      value = params.require(:hiring_form)
      allowed = { "open" => %w[token], "submit" => %w[token answers lock_version],
                  "resume" => %w[token file lock_version], "resume_download" => %w[token] }.fetch(action_name)
      raise ActionController::BadRequest unless value.is_a?(ActionController::Parameters) && (value.keys - allowed).empty?

      @attributes = value.to_unsafe_h
      token = @attributes["token"]
      raise HiringPortalAccess::Unavailable unless token.is_a?(String) && token.match?(HiringPortalAccess::TOKEN)

      @access = HiringPortalAccess.find_by(access_token: token)
      raise HiringPortalAccess::Unavailable unless @access
    end

    def with_access
      @access.hiring_application.with_lock do
        @access.reload
        raise HiringPortalAccess::Unavailable unless @access.active?

        yield
      end
    end

    def render_form
      submission = @access.hiring_submission
      render json: { form: { company_name: @access.company.name, introduction: @access.introduction,
        fields: @access.form_schema.fetch("fields"), expires_at: @access.expires_at,
        answers: submission.answers, submitted_at: submission.submitted_at, lock_version: submission.lock_version,
        resume: submission.resume.attached? ? { filename: submission.resume.filename.to_s, byte_size: submission.resume.blob.byte_size } : nil } }
    end

    def resume_blob(upload)
      unless upload.is_a?(ActionDispatch::Http::UploadedFile) && upload.size.between?(1, HiringSubmission::MAX_RESUME_BYTES)
        raise HiringSubmission::InvalidResume
      end
      type = Marcel::MimeType.for(upload.tempfile, name: upload.original_filename)
      raise HiringSubmission::InvalidResume unless HiringSubmission::RESUME_TYPES.include?(type)
      raise HiringSubmission::StorageUnavailable if ActiveStorage::Blob.service.public?

      ActiveStorage::Blob.create_before_direct_upload!(
        filename: File.basename(upload.original_filename.to_s.tr("\x00-\x1f\x7f", "-").last(200)), content_type: type,
        byte_size: upload.size, checksum: Digest::MD5.file(upload.tempfile.path).base64digest,
        metadata: { identified: true, analyzed: true, hiring_sha256: Digest::SHA256.file(upload.tempfile.path).hexdigest })
    end
end
