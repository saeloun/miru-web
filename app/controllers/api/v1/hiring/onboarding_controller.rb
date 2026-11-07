# frozen_string_literal: true

class Api::V1::Hiring::OnboardingController < Api::V1::Hiring::BaseController
  def index
    render_state(onboarding.review!)
  end

  def create
    result, created = onboarding.start!(attributes: mutation_attributes(:hiring_onboarding, Hiring::Onboarding::START_KEYS))
    render_state(result, status: created ? 201 : 200)
  end

  def complete
    render_state(onboarding.complete!(attributes: mutation_attributes(:hiring_onboarding, Hiring::Onboarding::START_KEYS)))
  end

  def renew
    render_state(onboarding.renew!(attributes: mutation_attributes(:hiring_onboarding, Hiring::Onboarding::VERSION_KEYS)))
  end

  private

    def application = @application ||= current_company.hiring_applications.find(optional_id(:application_id))

    def offer = @offer ||= application.hiring_offers.find(optional_id(:offer_id))

    def onboarding = @onboarding ||= Hiring::Onboarding.new(application:, offer:, actor: current_user)

    def render_state(result, status: 200)
      render json: { company_id: current_company.id, application: application_details(application), offer: offer.reload.review_details, onboarding: result }, status:
    end
end
