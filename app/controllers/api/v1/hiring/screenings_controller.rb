# frozen_string_literal: true

class Api::V1::Hiring::ScreeningsController < Api::V1::Hiring::BaseController
  def index
    application = current_company.hiring_applications.find(optional_id(:application_id))
    rows, pagination = page_records(application.hiring_screenings.order(id: :desc))
    render json: { company_id: current_company.id, application: application_details(application),
      screenings: rows.map(&:review_details), pagination:, time_zone: company_time_zone.tzinfo.name }
  end

  def create
    attributes = mutation_attributes(:screening, ::Hiring::Screening::KEYS)
    application = current_company.hiring_applications.find(optional_id(:application_id))
    screening = ::Hiring::Screening.new(application:, actor: current_user, attributes:).process
    render json: { company_id: current_company.id, application: application_details(application),
      screening: screening.review_details }, status: 201
  end
end
