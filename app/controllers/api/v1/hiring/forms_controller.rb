# frozen_string_literal: true

class Api::V1::Hiring::FormsController < Api::V1::Hiring::BaseController
  rescue_from ActiveStorage::FileNotFoundError do
    render json: { errors: "Resume unavailable." }, status: 404
  end
  rescue_from HiringSubmission::StorageUnavailable do
    render json: { errors: "Private resume storage is unavailable." }, status: 503
  end

  def index
    with_application do |application|
      records = application.hiring_submissions.includes(:hiring_portal_access, resume_attachment: :blob).order(id: :desc)
      rows, pagination = page_records(records)
      setting = current_company.hiring_setting
      version = setting.lock_version if setting&.approved? && setting.form["enabled"]
      unless HiringPortalAccess::CLOSED_STAGES.include?(application.stage)
        active = application.hiring_portal_accesses.where(revoked_at: nil).where("expires_at > ?", Time.current).order(id: :desc).pick(:id)
      end
      render json: { company_id: current_company.id, forms: rows.map { |record| record.review_details(include_sensitive: true) },
        pagination:, application_lock_version: application.lock_version, application_stage: application.stage,
        active_access_id: active, approved_setting_version: version }
    end
  end

  def create
    attributes = mutation_attributes(:hiring_form, %w[company_id lock_version approved_setting_version])
    with_application(attributes) do |application|
      setting = current_company.hiring_setting
      unless setting && attributes["approved_setting_version"].is_a?(Integer) && setting.lock_version == attributes["approved_setting_version"]
        raise ::Hiring::Intake::Conflict, "The approved form changed. Reload before issuing a link."
      end
      access = Audited.audit_class.as_user(current_user) { ::Hiring::Form.issue!(application:, setting:, actor: current_user) }
      render json: { company_id: current_company.id, form_access: {
        id: access.id, url: hiring_form_url(anchor: access.access_token), expires_at: access.expires_at } }, status: 201
    end
  end

  def destroy
    attributes = mutation_attributes(:hiring_form, %w[company_id lock_version])
    with_application(attributes) do |application|
      access = application.hiring_portal_accesses.find(optional_id(:id))
      Audited.audit_class.as_user(current_user) do
        access.update!(revoked_at: Time.current) unless access.revoked_at?
        application.touch
      end
      render json: { company_id: current_company.id, form_access: access.slice(:id, :revoked_at) }
    end
  end

  def resume
    with_application do |application|
      submission = application.hiring_portal_accesses.find(optional_id(:id)).hiring_submission
      data = submission.resume_bytes
      response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
      send_data data, filename: submission.resume.filename.to_s, type: submission.resume.blob.content_type, disposition: "attachment"
    end
  end

  private

    def with_application(attributes = nil)
      current_user.with_lock do
        raise Pundit::NotAuthorizedError unless current_user.current_workspace_id == current_company.id && HiringPolicy.new(current_user, HiringApplication).create?

        current_company.with_lock do
          application = current_company.hiring_applications.find(optional_id(:application_id))
          application.with_lock do
            if attributes && (!attributes["lock_version"].is_a?(Integer) || application.lock_version != attributes["lock_version"])
              raise ::Hiring::Intake::Conflict, "The application changed. Reload before issuing a link."
            end
            yield application
          end
        end
      end
    end
end
