# frozen_string_literal: true

class Api::V1::Hiring::PipelineController < Api::V1::Hiring::BaseController
  def index
    filters = (search_filters.is_a?(ActionController::Parameters) ? search_filters.to_unsafe_h : search_filters)
      .except("controller", "action", "format")
    result = ::Hiring::Pipeline.new(company: current_company, actor: current_user, filters:, time_zone: company_time_zone).call
    render json: result.merge(company_id: current_company.id, time_zone: company_time_zone.tzinfo.name,
      stages: HiringApplication::STAGES.index_with(&:humanize),
      applications: result.fetch(:applications).map { |record| application_details(record) })
  end

  def search
    load_search(::Hiring::Pipeline::FILTERS - %w[company_id query page])
    index
  end
end
