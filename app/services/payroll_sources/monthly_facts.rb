# frozen_string_literal: true

module PayrollSources
  class MonthlyFacts
    VERSION = "miru-monthly-facts-v1"
    REVIEW_ROLES = %w[owner admin book_keeper].freeze

    def initialize(company:, employment:, actor:, month:, policy_versions: {})
      @company_id = company.id
      @employment_id = employment.id
      @actor_id = actor&.id
      @month = Date.iso8601("#{month}-01") if month.to_s.match?(/\A\d{4}-\d{2}\z/)
      raise ArgumentError, "month must use YYYY-MM" unless @month

      unless policy_versions.is_a?(Hash) && (policy_versions.keys - [:pay, :attendance]).empty?
        raise ArgumentError, "policy versions must contain only pay and attendance identifiers"
      end

      @pay_policy_version = policy_version(policy_versions[:pay])
      @attendance_policy_version = policy_version(policy_versions[:attendance])
    end

    def call
      ApplicationRecord.transaction do
        authorize!
        capture
      end
    end

    def self.current_snapshot?(snapshot, company:, employment:)
      return false unless snapshot.is_a?(Hash) && snapshot["company_id"] == company.id &&
        snapshot.dig("employment", "id") == employment.id

      collector = new(
        company:, employment:, actor: nil, month: snapshot.fetch("month"),
        policy_versions: {
          pay: snapshot.fetch("pay_policy_version"),
          attendance: snapshot.fetch("attendance_policy_version")
        }
      )
      ApplicationRecord.transaction do
        current = collector.send(:capture)
        snapshot.except("captured_at") == current.except("captured_at")
      end
    rescue ArgumentError, KeyError, TypeError, ActiveRecord::RecordNotFound
      false
    end

    private

      def capture
        @company = Company.select(:id, :base_currency, :country, :timezone, :working_days, :working_hours).find(@company_id)
        @employment = @company.employments.kept
          .select(:id, :company_id, :user_id, :employment_type, :joined_at, :resigned_at, :updated_at).find(@employment_id)
        raise ActiveRecord::RecordNotFound unless User.kept.exists?(id: @employment.user_id)

        @exceptions = []
        payload = source_payload
        digest = Digest::SHA256.hexdigest(JSON.generate(payload))
        deep_freeze(payload.merge("digest" => digest, "captured_at" => Time.current.iso8601(6)))
      end

      def policy_version(value)
        return nil if value.nil?
        return value.dup if value.is_a?(String) && value.match?(/\A[a-zA-Z0-9_.:-]{1,128}\z/)

        raise ArgumentError, "policy version must be a version identifier"
      end

      def authorize!
        actor = User.kept.select(:id, :current_workspace_id).find_by(id: @actor_id, current_workspace_id: @company_id)
        authorized = actor && actor.employments.kept.where(company_id: @company_id, joined_at: ..Date.current)
          .where("resigned_at IS NULL OR resigned_at >= ?", Date.current).exists? &&
          actor.roles.where(resource_type: "Company", resource_id: @company_id, name: REVIEW_ROLES).exists?
        raise Pundit::NotAuthorizedError unless authorized
      end

      def source_payload
        work = work_facts
        timeoff = timeoff_facts
        review_exceptions(work, timeoff)
        {
          "source_version" => VERSION,
          "company_id" => @company.id,
          "company_currency" => @company.base_currency,
          "company_calendar" => {
            "country" => @company.country,
            "timezone" => @company.timezone,
            "working_days" => @company.working_days,
            "working_hours" => @company.working_hours
          },
          "month" => @month.strftime("%Y-%m"),
          "employment" => employment_facts,
          "pay_policy_version" => @pay_policy_version,
          "attendance_policy_version" => @attendance_policy_version,
          "work_entries" => work,
          "timeoff_entries" => timeoff,
          "review_exceptions" => @exceptions
        }
      end

      def employment_facts
        {
          "id" => @employment.id,
          "user_id" => @employment.user_id,
          "employment_type" => @employment.employment_type,
          "joined_at" => @employment.joined_at&.iso8601,
          "resigned_at" => @employment.resigned_at&.iso8601,
          "updated_at" => timestamp(@employment)
        }
      end

      def work_facts
        TimesheetEntry.kept.joins(project: :client)
          .where(clients: { company_id: @company.id }, user_id: @employment.user_id, work_date: month_range)
          .select(:id, :project_id, :duration, :work_date, :review_status, :locked, :updated_at)
          .includes(project: :client).order(:id).map do |entry|
          {
            "id" => entry.id,
            "date" => entry.work_date.iso8601,
            "duration_minutes" => decimal_minutes(entry),
            "review_status" => entry.review_status,
            "locked" => entry.locked,
            "updated_at" => timestamp(entry),
            "project" => source_reference(entry.project),
            "client" => source_reference(entry.project.client)
          }
        end
      end

      def timeoff_facts
        TimeoffEntry.from_workspace(@company.id)
          .where(user_id: @employment.user_id, leave_date: month_range)
          .select(:id, :duration, :leave_date, :updated_at, :leave_type_id, :holiday_info_id, :custom_leave_id)
          .includes(leave_type: :leave, holiday_info: :holiday, custom_leave: :leave).order(:id).map do |entry|
          {
            "id" => entry.id,
            "date" => entry.leave_date.iso8601,
            "duration_minutes" => entry.duration.to_s,
            "updated_at" => timestamp(entry),
            "leave_type" => source_reference(entry.leave_type),
            "leave" => source_reference(entry.leave_type&.leave),
            "holiday_info" => source_reference(entry.holiday_info),
            "holiday" => source_reference(entry.holiday_info&.holiday),
            "custom_leave" => source_reference(entry.custom_leave),
            "custom_leave_parent" => source_reference(entry.custom_leave&.leave)
          }
        end
      end

      def decimal_minutes(entry)
        duration = BigDecimal(entry.duration.to_s)
        return duration.to_s("F") if duration.finite? && duration >= 0

        @exceptions << { "code" => "invalid_work_duration", "source_id" => entry.id }
        nil
      end

      def source_reference(record)
        return nil unless record

        reference = { "id" => record.id, "updated_at" => timestamp(record) }
        reference["discarded_at"] = record.discarded_at&.iso8601(6) if record.respond_to?(:discarded_at)
        reference
      end

      def timestamp(record)
        record.updated_at&.iso8601(6)
      end

      def month_range
        @month..@month.end_of_month
      end

      def review_exceptions(work, timeoff)
        add_exception("missing_pay_policy") unless @pay_policy_version
        add_exception("missing_attendance_policy") unless @attendance_policy_version
        add_exception("missing_employment_start") unless @employment.joined_at
        add_exception("missing_employment_type") if @employment.employment_type.blank?
        add_exception("ambiguous_employment") if @company.employments.kept.where(user_id: @employment.user_id).count > 1
        add_exception("no_work_entries") if work.empty?
        add_exception("no_timeoff_entries") if timeoff.empty?
        add_exception("timeoff_pay_classification_required") if timeoff.any?
        check_employment_period(work, timeoff)
        check_entry_review(work)
        check_timeoff_parents(timeoff)
        (work.map { |entry| entry.fetch("date") } & timeoff.map { |entry| entry.fetch("date") }).sort.each do |date|
          @exceptions << { "code" => "work_timeoff_same_date", "date" => date }
        end
      end

      def check_employment_period(work, timeoff)
        joined = @employment.joined_at
        resigned = @employment.resigned_at
        add_exception("employment_outside_month") if (joined && joined > @month.end_of_month) ||
          (resigned && resigned < @month)
        add_exception("partial_employment_month") if (joined && month_range.cover?(joined) && joined > @month) ||
          (resigned && month_range.cover?(resigned) && resigned < @month.end_of_month)
        (work + timeoff).each do |entry|
          date = Date.iso8601(entry.fetch("date"))
          next unless (joined && date < joined) || (resigned && date > resigned)

          @exceptions << { "code" => "entry_outside_employment", "source_id" => entry.fetch("id"), "date" => date.iso8601 }
        end
      end

      def check_entry_review(work)
        work.each do |entry|
          if %w[pending_review rejected].include?(entry.fetch("review_status"))
            @exceptions << { "code" => "work_review_required", "source_id" => entry.fetch("id") }
          end
          next unless %w[project client].any? { |key| entry.fetch(key)["discarded_at"] }

          @exceptions << { "code" => "discarded_work_parent", "source_id" => entry.fetch("id") }
        end
      end

      def check_timeoff_parents(timeoff)
        timeoff.each do |entry|
          next unless %w[leave_type leave holiday_info holiday custom_leave custom_leave_parent].any? do |key|
            entry[key]&.fetch("discarded_at", nil)
          end

          @exceptions << { "code" => "discarded_timeoff_parent", "source_id" => entry.fetch("id") }
        end
      end

      def add_exception(code)
        @exceptions << { "code" => code }
      end

      def deep_freeze(value)
        case value
        when Hash
          value.each { |key, item| deep_freeze(key); deep_freeze(item) }
        when Array
          value.each { |item| deep_freeze(item) }
        end
        value.freeze
      end
  end
end
