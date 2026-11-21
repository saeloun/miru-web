# frozen_string_literal: true

class SalaryHistoryReviewsController < ApplicationController
  before_action :prevent_caching
  before_action :authorize_review

  rescue_from ActionController::BadRequest, ActionController::ParameterMissing do
    render :recovery, formats: [:html], layout: false, status: 422, locals: {
      message: "Choose retain or mark as abandoned for every salary awaiting review. No decisions were saved.",
      recovery_path: salary_history_review_path(employment_id: @employment.id), recovery_label: "Reopen salary history"
    }
  end

  def show
    @versions = @employment.compensation_versions.active.order(:effective_on, :id)
    render layout: false
  end

  def update
    attributes = params.require(:salary_review)
    unless attributes.is_a?(ActionController::Parameters) && (attributes.keys - %w[company_id active_ids decisions]).empty?
      raise ActionController::BadRequest
    end
    unless attributes[:company_id].to_s == current_company.id.to_s
      return render :recovery, formats: [:html], layout: false, status: 409, locals: {
        message: "Workspace changed. No salary review was saved. Open your current workspace team before reviewing salary history.",
        recovery_path: "/team", recovery_label: "Open current workspace team"
      }
    end
    expected = ids(attributes[:active_ids])
    decisions = attributes[:decisions]
    unless decisions.is_a?(Array) && decisions.size <= 10_000 && decisions.all? do |item|
      item.is_a?(ActionController::Parameters) && item.keys.sort == %w[decision id] && %w[retain retire].include?(item[:decision])
    end
      raise ActionController::BadRequest
    end
    decision_ids = ids(decisions.pluck(:id))
    @employment.with_lock do
      ApplicationRecord.uncached { authorize_review }
      active = @employment.compensation_versions.active.order(:id).to_a
      unless active.map(&:id) == expected.sort
        return render :recovery, formats: [:html], layout: false, status: 409, locals: {
          message: "Salary history changed. No decisions were saved. Reopen salary history to review the latest versions.",
          recovery_path: salary_history_review_path(employment_id: @employment.id), recovery_label: "Reopen salary history"
        }
      end
      unresolved = active.filter_map { |version| version.id if version.reviewed_at.nil? }
      raise ActionController::BadRequest unless unresolved.any? && decision_ids.sort == unresolved

      retained = decisions.filter_map { |item| item[:id].to_i if item[:decision] == "retain" }
      retired = decision_ids - retained
      now = Time.current
      @employment.compensation_versions.where(id: retained).update_all(reviewed_at: now, updated_at: now)
      @employment.compensation_versions.where(id: retired).update_all(superseded_at: now, updated_at: now)
      current_company.audits.create!(action: "compensation_history_review", user: current_user, audited_changes: {
        employment_id: @employment.id, retained_compensation_version_ids: retained, superseded_compensation_version_ids: retired
      })
    end
    redirect_to salary_history_review_path(employment_id: @employment.id), status: 303
  end

  private

    def ids(values)
      unless values.is_a?(Array) && values.size <= 10_000 && values.all? do |value|
        (value.is_a?(String) || value.is_a?(Integer)) && value.to_s.match?(/\A[1-9]\d{0,18}\z/)
      end
        raise ActionController::BadRequest
      end
      result = values.map(&:to_i)
      raise ActionController::BadRequest unless result.uniq == result

      result
    end

    def authorize_review
      authorize EmployeeRecord, :manage?
      @employment = current_company.employments.find(params[:employment_id])
    end

    def prevent_caching
      response.headers["Cache-Control"] = "private, no-store"
      response.headers["Pragma"] = "no-cache"
      response.headers["X-Content-Type-Options"] = "nosniff"
      response.headers["X-Robots-Tag"] = "noindex, nofollow"
      response.headers["Referrer-Policy"] = "no-referrer"
    end
end
