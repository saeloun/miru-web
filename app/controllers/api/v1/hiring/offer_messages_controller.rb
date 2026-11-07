# frozen_string_literal: true

class Api::V1::Hiring::OfferMessagesController < Api::V1::Hiring::CandidateMessagesController
  private

    def communication
      @communication ||= begin
        application = current_company.hiring_applications.find(optional_id(:application_id))
        offer = application.hiring_offers.find(request.path_parameters.fetch(:offer_id))
        Hiring::OfferCommunication.new(offer:, actor: current_user)
      end
    end
end
