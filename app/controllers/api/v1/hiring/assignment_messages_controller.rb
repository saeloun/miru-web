# frozen_string_literal: true

class Api::V1::Hiring::AssignmentMessagesController < Api::V1::Hiring::CandidateMessagesController
  private

    def communication
      @communication ||= begin
        application = current_company.hiring_applications.find(optional_id(:application_id))
        assignment = application.hiring_assignments.find(optional_id(:assignment_id))
        Hiring::AssignmentCommunication.new(assignment:, actor: current_user)
      end
    end
end
