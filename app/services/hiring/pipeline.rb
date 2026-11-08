# frozen_string_literal: true

module Hiring
  class Pipeline
    FILTERS = %w[company_id query stage role_id owner_employment_id interviewer_panel_member_id experience_min experience_max from to queue page].freeze
    QUEUES = %w[pending_reviews overdue_assignments upcoming_interviews missing_feedback hold_follow_ups].freeze

    def initialize(company:, actor:, filters: {}, time_zone: Time.zone)
      @company, @actor, @filters, @time_zone = company, actor, filters.with_indifferent_access, time_zone
      @now = Time.current
    end

    def call
      unless @actor && @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, HiringApplication).index?
        raise Pundit::NotAuthorizedError
      end
      validate!
      applications = filtered_applications
      queues = queue_ids(applications)
      records = @filters[:queue] ? applications.where(id: queues.fetch(@filters[:queue])) : applications
      rows = records.includes(:hiring_candidate, :hiring_role, owner_employment: :user)
        .order(received_at: :desc, id: :desc).offset((@page - 1) * 20).limit(21).to_a
      { metrics: metrics(applications), queues: queues.transform_values(&:size), applications: rows.first(20),
        pagination: { page: @page, per_page: 20, has_more: rows.size > 20 } }
    end

    private

      def validate!
        invalid! unless (@filters.keys.map(&:to_s) - FILTERS).empty?
        unless (@filters[:company_id].is_a?(String) || @filters[:company_id].is_a?(Integer)) && @filters[:company_id].to_s == @company.id.to_s
          raise Intake::WorkspaceChanged, "The hiring workspace changed. Reload the current workspace."
        end
        @query = @filters[:query] || ""
        invalid! unless @query.is_a?(String) && @query.valid_encoding? && @query.length <= 200 && !@query.include?("\0")
        invalid! if @filters[:stage] && !HiringApplication::STAGES.include?(@filters[:stage])
        invalid! if @filters[:queue] && !QUEUES.include?(@filters[:queue])
        @role_id, @owner_id, @interviewer_id = %i[role_id owner_employment_id interviewer_panel_member_id].map { |key| identity(key) }
        @page = identity(:page) || 1
        invalid! if @page > 99_999
        @minimum, @maximum = %i[experience_min experience_max].map { |key| experience(key) }
        invalid! if @minimum && @maximum && @minimum > @maximum
        @from, @to = %i[from to].map { |key| date(key) }
        invalid! if @from && @to && @from > @to
      end

      def invalid!
        raise Intake::InvalidInput, "Use valid pipeline filters."
      end

      def identity(key)
        value = @filters[key]
        return if value.nil?
        invalid! unless (value.is_a?(String) || value.is_a?(Integer)) && value.to_s.match?(/\A[1-9]\d{0,18}\z/)

        value.to_i
      end

      def experience(key)
        value = @filters[key]
        return if value.nil?
        invalid! unless (value.is_a?(String) || value.is_a?(Numeric)) && value.to_s.match?(/\A\d{1,3}(?:\.\d{1,2})?\z/)

        BigDecimal(value.to_s)
      end

      def date(key)
        value = @filters[key]
        return if value.nil?
        invalid! unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/)

        parsed = Date.iso8601(value)
        invalid! unless parsed.year.positive?
        parsed
      rescue Date::Error
        invalid!
      end

      def filtered_applications
        records = @company.hiring_applications
        if @query.strip.present?
          term = "%#{HiringCandidate.sanitize_sql_like(@query.strip)}%"
          records = records.joins(:hiring_candidate)
            .where("hiring_candidates.full_name ILIKE :term OR hiring_candidates.email ILIKE :term", term:)
        end
        records = records.where(stage: @filters[:stage]) if @filters[:stage]
        records = records.where(hiring_role_id: @role_id) if @role_id
        records = records.where(owner_employment_id: @owner_id) if @owner_id
        if @interviewer_id
          panel = @company.hiring_panel_members.where(id: @interviewer_id).select(:id)
          interviews = HiringAccessGrant.where(company: @company, hiring_panel_member_id: panel).select(:hiring_interview_id)
          records = records.where(id: @company.hiring_interviews.where(id: interviews).select(:hiring_application_id))
        end
        records = records.where("hiring_applications.received_at >= ?", @from.in_time_zone(@time_zone)) if @from
        records = records.where("hiring_applications.received_at < ?", @to.next_day.in_time_zone(@time_zone)) if @to
        records = records.where(id: experienced_ids(records)) if @minimum || @maximum
        records
      end

      def experienced_ids(records)
        # Submitted answers are encrypted; compare only the latest submitted form in this filtered workspace.
        submissions = HiringSubmission.where(company: @company, hiring_application_id: records.select(:id)).where.not(submitted_at: nil)
          .order(submitted_at: :desc, id: :desc).to_a.uniq(&:hiring_application_id)
        submissions.filter_map do |submission|
          value = submission.answers["total_experience"]
          next unless value.to_s.match?(/\A\d+(?:\.\d+)?\z/)

          years = BigDecimal(value.to_s)
          submission.hiring_application_id if (!@minimum || years >= @minimum) && (!@maximum || years <= @maximum)
        end
      end

      def queue_ids(records)
        active = records.where.not(stage: HiringFeedback::CLOSED_APPLICATION_STAGES).select(:id)
        assignments = HiringAssignment.where(company: @company, hiring_application_id: active, ended_at: nil)
        interviews = @company.hiring_interviews.where(hiring_application_id: active)
        bookings = HiringInterviewBooking.where(company: @company, hiring_interview_id: interviews.select(:id))
        pending = assignments.where(status: "submitted").distinct.pluck(:hiring_application_id)
        overdue = assignments.where(status: "issued").where("due_at < ?", @now).distinct.pluck(:hiring_application_id)
        upcoming = interviews.where(status: "planned", id: bookings.scheduled.where("starts_at >= ?", @now).select(:hiring_interview_id))
        missing = HiringFeedback.collectible.where(company: @company, submitted_at: nil)
          .where(hiring_interview_bookings: { id: bookings.where("ends_at <= ?", @now).select(:id) })
        {
          "pending_reviews" => pending,
          "overdue_assignments" => overdue,
          "upcoming_interviews" => upcoming.distinct.pluck(:hiring_application_id),
          "missing_feedback" => HiringInterview.where(id: missing.select("hiring_interview_bookings.hiring_interview_id")).distinct.pluck(:hiring_application_id),
          "hold_follow_ups" => hold_ids(records.where(stage: "on_hold"))
        }
      end

      def hold_ids(records)
        latest_decisions(records).filter_map do |decision|
          details = decision.details
          next unless details["outcome"] == "hold" && details["follow_up_on"]

          decision.hiring_application_id if Date.iso8601(details["follow_up_on"]) <= @now.in_time_zone(details.fetch("time_zone")).to_date
        end
      end

      def latest_decisions(records)
        @company.hiring_decisions.where(hiring_application_id: records.select(:id), state: "finalized")
          .order(finalized_at: :desc, id: :desc).to_a.uniq(&:hiring_application_id)
      end

      def metrics(records)
        applications = records.to_a
        ids = applications.map(&:id)
        visits = HiringApplication::STAGES.index_with { Set.new }
        applications.each { |application| visits.fetch("received") << application.id }
        edges, hired = {}, {}
        Audited.audit_class.where(auditable_type: "HiringApplication", auditable_id: ids, action: "update")
          .order(:created_at, :id).each do |audit|
          change = audit.audited_changes["stage"]
          next unless change.is_a?(Array) && change.size == 2 && change.all? { |stage| HiringApplication::STAGES.include?(stage) } && change.first != change.last

          from, to = change
          visits.fetch(from) << audit.auditable_id
          visits.fetch(to) << audit.auditable_id
          (edges[[from, to]] ||= Set.new) << audit.auditable_id
          hired[audit.auditable_id] ||= audit.created_at if to == "hired"
        end
        durations = applications.filter_map do |application|
          finished = hired[application.id]
          (finished - application.received_at) / 1.day if finished && finished >= application.received_at
        end
        reasons = latest_decisions(records.where(stage: "rejected")).select { |decision| decision.details["outcome"] == "reject" }
          .group_by { |decision| decision.details.fetch("reason") }.transform_values(&:size)
        { total_applications: applications.size,
          stage_counts: HiringApplication::STAGES.index_with { |stage| applications.count { |application| application.stage == stage } },
          stage_conversions: edges.map do |(from, to), converted|
            { from:, to:, count: converted.size, recorded_from_count: visits.fetch(from).size,
              percent: (converted.size.fdiv(visits.fetch(from).size) * 100).round(2) }
          end,
          rejection_reasons: reasons, rejected_without_reason: applications.count { |application| application.stage == "rejected" } - reasons.values.sum,
          time_to_hire: { count: durations.size, average_days: durations.empty? ? nil : (durations.sum / durations.size).round(2),
            hired_without_timing: applications.count do |application|
              application.stage == "hired" && (!hired[application.id] || hired.fetch(application.id) < application.received_at)
            end } }
      end
  end
end
