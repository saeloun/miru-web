# frozen_string_literal: true

class Api::V1::Hiring::BaseController < Api::V1::ApplicationController
  include ActionController::RequestForgeryProtection
  self.allow_forgery_protection = ActionController::Base.allow_forgery_protection
  protect_from_forgery with: :exception, unless: :token_authenticated_request?
  prepend_before_action :private_headers
  before_action :authorize_hiring
  before_action -> { require_workspace!(params[:company_id]) }, if: -> { request.get? }

  rescue_from ActionController::ParameterMissing, ActionController::BadRequest do
    render json: { errors: "Invalid hiring parameters." }, status: 400
  end
  rescue_from ::Hiring::Intake::InvalidInput do |error|
    render json: { errors: error.message }, status: 422
  end
  rescue_from ::Hiring::Intake::Conflict do |error|
    render json: { errors: error.message, company_id: current_company.id,
      existing_application_id: error.existing_application_id }.compact, status: 409
  end
  rescue_from ActiveRecord::StaleObjectError do
    render json: { errors: "This hiring record changed. Reload before saving." }, status: 409
  end
  rescue_from ActiveRecord::RecordNotFound do
    render json: { errors: "Hiring record unavailable." }, status: 404
  end
  rescue_from ActionController::InvalidAuthenticityToken do
    render json: { errors: "Your session changed. Reload before saving." }, status: 422
  end
  rescue_from ActiveStorage::FileNotFoundError do
    render json: { errors: "File unavailable." }, status: 404
  end
  rescue_from HiringSubmission::StorageUnavailable, IOError, SystemCallError do
    render json: { errors: "Private hiring storage is unavailable. Please try again." }, status: 503
  end

  private

    def private_headers
      response.headers.merge!("Cache-Control" => "private, no-store", "Pragma" => "no-cache", "X-Content-Type-Options" => "nosniff")
    end

    def authorize_hiring
      raise Pundit::NotAuthorizedError unless current_company.id == current_user.current_workspace_id

      authorize HiringApplication, :index?, policy_class: HiringPolicy
    end

    def require_workspace!(identity)
      unless (identity.is_a?(String) || identity.is_a?(Integer)) && identity.to_s == current_company.id.to_s
        raise ::Hiring::Intake::Conflict, "The hiring workspace changed. Reload the current workspace."
      end
    end

    def mutation_attributes(root, keys)
      value = params.require(root)
      raise ActionController::BadRequest unless value.is_a?(ActionController::Parameters) && (value.keys - keys).empty?

      require_workspace!(value[:company_id])
      value.to_unsafe_h
    end

    def query_text(key = :query)
      value = search_filters[key]
      value = "" if value.nil?
      raise ActionController::BadRequest unless value.is_a?(String) && value.length <= 200 && !value.include?("\0")

      value.strip
    end

    def optional_id(key)
      value = search_filters[key]
      return nil if value.nil?
      raise ActionController::BadRequest unless (value.is_a?(String) || value.is_a?(Integer)) && value.to_s.match?(/\A[1-9]\d{0,18}\z/)

      value.to_i
    end

    def page_records(relation)
      value = search_filters[:page] || "1"
      unless (value.is_a?(String) || value.is_a?(Integer)) && value.to_s.match?(/\A[1-9]\d{0,4}\z/)
        raise ActionController::BadRequest
      end

      page = value.to_i
      rows = relation.offset((page - 1) * 20).limit(21).to_a
      [rows.first(20), { page:, per_page: 20, has_more: rows.size > 20 }]
    end

    def search_filters
      @search_filters || params
    end

    def load_search(keys)
      @search_filters = mutation_attributes(:hiring_search, %w[company_id query page] + keys).with_indifferent_access
    end

    def application_details(record)
      owner = record.owner_employment
      record.slice(:id, :stage, :source, :received_at, :created_at, :lock_version).merge(
        candidate: record.hiring_candidate.slice(:id, :full_name, :email),
        submitted_name: record.submitted_name,
        role: record.hiring_role&.slice(:id, :title, :status),
        owner: owner && { id: owner.id, full_name: owner.user.full_name, employee_id: owner.employee_id })
    end
end
