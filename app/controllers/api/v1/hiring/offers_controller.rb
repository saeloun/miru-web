# frozen_string_literal: true

class Api::V1::Hiring::OffersController < Api::V1::Hiring::BaseController
  def index
    offers.with_application do
      records, pagination = page_records(application.hiring_offers.order(id: :desc))
      render json: { company_id: current_company.id, application: application_details(application),
        offers: records.map(&:review_details), pagination: }
    end
  end

  def create
    record, created = offers.create!(attributes: mutation_attributes(:hiring_offer, Hiring::Offers::CREATE_KEYS))
    render_offer(record, status: created ? 201 : 200)
  end

  def update
    record = offers.update!(offer: application.hiring_offers.find(optional_id(:id)), attributes: mutation_attributes(:hiring_offer, Hiring::Offers::UPDATE_KEYS))
    render_offer(record)
  end

  def issue
    record = offers.issue!(offer: application.hiring_offers.find(optional_id(:id)), attributes: mutation_attributes(:hiring_offer, Hiring::Offers::ISSUE_KEYS))
    render_offer(record)
  end

  def revoke
    record = offers.revoke!(offer: application.hiring_offers.find(optional_id(:id)), attributes: mutation_attributes(:hiring_offer, Hiring::Offers::ISSUE_KEYS))
    render_offer(record)
  end

  private

    def application = @application ||= current_company.hiring_applications.find(optional_id(:application_id))

    def offers = @offers ||= Hiring::Offers.new(application:, actor: current_user)

    def render_offer(record, status: 200)
      render json: { company_id: current_company.id, application: application_details(application), offer: record.review_details }, status:
    end
end
