# frozen_string_literal: true

module Hiring
  class InterviewHandover
    COMPENSATION_FIELDS = %w[current_compensation expected_compensation].freeze

    def initialize(interview:, actor:)
      @interview, @actor = interview, actor
      @application = interview.hiring_application
    end

    def call
      assessment = @application.hiring_assignments.joins(:submission)
        .where.not(hiring_assignment_submissions: { submitted_at: nil }).order(id: :desc).first
      submission = @application.hiring_submissions.where.not(submitted_at: nil).order(id: :desc).first
      { candidate: { full_name: @application.submitted_name, email: @application.hiring_candidate.email },
        role: @application.hiring_role&.slice(:id, :title), form: submission && form_details(submission),
        assessment: assessment&.review_details }
    end

    private

      def form_details(submission)
        result = submission.review_details.slice(:id, :submitted_at, :fields, :answers, :resume)
        if HiringInterviewPolicy.new(@actor, @interview).compensation?
          full = submission.review_details(include_sensitive: true)
          result[:fields] += full.fetch(:fields).select { |field| COMPENSATION_FIELDS.include?(field["id"]) }
          result[:answers] = result.fetch(:answers).merge(full.fetch(:answers).slice(*COMPENSATION_FIELDS))
        end
        result
      end
  end
end
