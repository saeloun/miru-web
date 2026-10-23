# frozen_string_literal: true

module AgreementAuthoring
  extend ActiveSupport::Concern
  include ActionController::RequestForgeryProtection

  included do
    self.allow_forgery_protection = ActionController::Base.allow_forgery_protection
    protect_from_forgery with: :exception, unless: -> { request.get? || token_authenticated_request? }
    before_action -> { response.headers["Cache-Control"] = "private, no-store" }
    rescue_from ActiveRecord::StaleObjectError do
      render json: { errors: "This document changed. Reload it before saving; your edits were not applied." }, status: 409
    end
  end

  private

    def current_agreement_workspace?(attributes)
      return true if attributes[:company_id].to_s == current_company.id.to_s

      render json: { errors: "Workspace changed. Reload before editing this document." }, status: 409
      false
    end

    def update_agreement_record(record, attributes)
      version = attributes[:lock_version]
      unless version.is_a?(Integer) && version >= 0 && version == record.lock_version
        raise ActiveRecord::StaleObjectError.new(record, "update")
      end
      record.update!(attributes.except(:company_id))
    end

    def agreement_page(records)
      page = params[:page] || "1"
      unless page.is_a?(String) && page.match?(/\A[1-9]\d{0,5}\z/)
        raise ActionController::BadRequest, "Invalid page"
      end
      pages = [(records.count / 30.0).ceil, 1].max
      selected = [page.to_i, pages].min
      [records.order(id: :desc).limit(30).offset((selected - 1) * 30), { page: selected, pages: }]
    end

    def agreement_metadata(record)
      record.slice(:id, :title, :kind, :lock_version, :created_at, :updated_at)
    end
end
