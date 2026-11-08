# frozen_string_literal: true

class Api::V1::Hiring::InterviewsController < Api::V1::Hiring::BaseController
  def index
    with_application do |application|
      rows, pagination = page_records(application.hiring_interviews.order(number: :desc))
      render json: { company_id: current_company.id, application: application.slice(:id, :stage, :lock_version),
        interviews: rows.map(&:admin_details), pagination: }
    end
  end

  def create
    attributes = mutation_attributes(:hiring_interview, ::Hiring::Interviews::CREATE_KEYS)
    with_application do |application|
      record = ::Hiring::Interviews.new(application:, actor: current_user).create!(attributes:)
      render json: { company_id: current_company.id, application: application.reload.slice(:id, :stage, :lock_version), interview: record.admin_details },
        status: record.previously_new_record? ? 201 : 200
    end
  end

  def update
    attributes = mutation_attributes(:hiring_interview, ::Hiring::Interviews::UPDATE_KEYS)
    with_application do |application|
      record = application.hiring_interviews.find(optional_id(:id))
      ::Hiring::Interviews.new(application:, actor: current_user).update!(record:, attributes:)
      render json: { company_id: current_company.id, application: application.reload.slice(:id, :stage, :lock_version), interview: record.admin_details }
    end
  end

  private

    def with_application
      current_user.with_lock do
        authorize_hiring
        current_company.lock!("FOR NO KEY UPDATE") unless request.get? || request.head?
        application = current_company.hiring_applications.find(optional_id(:application_id))
        application.with_lock { yield application }
      end
    end
end
