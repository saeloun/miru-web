# frozen_string_literal: true

class Api::V1::Hiring::DecisionMessagesController < Api::V1::Hiring::CandidateMessagesController
  private

    def communication
      @communication ||= begin
        application = current_company.hiring_applications.find(optional_id(:application_id))
        decision = application.hiring_decisions.find(request.path_parameters.fetch(:decision_id))
        Hiring::DecisionCommunication.new(decision:, actor: current_user)
      end
    end
end
