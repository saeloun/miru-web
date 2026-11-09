# frozen_string_literal: true

module Payroll
  class MercuryRevisionGuard
    def self.same_line?(first, second)
      normalized_line(first) == normalized_line(second)
    end

    def self.normalized_line(line)
      value = line.deep_dup
      value["source_snapshot"]&.delete("captured_at")
      value["preparation"]&.delete("billing_identity")
      value.delete("preparation") if value["preparation"].blank?
      value
    end
    private_class_method :normalized_line

    def initialize(run)
      @run = run
    end

    def check!(payload)
      protected_reports = protected_india_handoffs.to_a
      india_handoffs.find_each do |handoff|
        line = payload["lines"].find { |entry| entry["employment_id"] == handoff.employment_id }
        retained_report = protected_reports.find { |report| report.id == handoff.id }
        next if line && (IndiaHandoff.line_digest(line) == handoff.line_digest ||
          retained_report && protected_line_with_reports?(line, protected_reports) && protected_india_report?(retained_report, line))

        raise Workflow::Conflict, "An India payroll handoff exists, so its approved report and claims must stay unchanged in this revision"
      end
      in_flight_groups.each do |group|
        line = payload["lines"].find { |entry| entry["employment_id"] == group.employment_id }
        next if line && PayrollPaymentGroup.line_digest(line) == group.line_digest

        name = group.employment.user.full_name
        raise Workflow::Conflict, "A bank transfer exists for #{name}, so their amounts and claims must stay unchanged in this revision"
      end
    rescue NoMethodError, TypeError
      raise Workflow::Conflict, "This revision cannot be compared with bank activity", cause: nil
    end

    def after_revision!(actor)
      void_prepared_legs(actor)
      release_reservations
    end

    def protected_line?(line)
      protected_line_with_reports?(line, protected_india_handoffs.to_a)
    end

    def retained_lines
      reports = protected_india_handoffs.to_a
      Array(@run.current_revision&.payroll_payload&.fetch("lines", [])).select { |line| protected_line_with_reports?(line, reports) }
    end

    private

      def protected_line_with_reports?(line, reports)
        employment_id = line["employment_id"]
        current = @run.current_revision&.payroll_payload&.fetch("lines", [])&.find { |entry| entry["employment_id"] == employment_id }
        return false unless current && self.class.same_line?(current, line)
        unless current.dig("preparation", "billing_identity") == line.dig("preparation", "billing_identity")
          employment = Employment.find_by(id: employment_id, company_id: @run.company_id)
          return false unless employment && BillingIdentity.new(employment).valid_binding?(line.dig("preparation", "billing_identity"))
        end

        return true if reports.any? { |report| report.employment_id == employment_id && protected_india_report?(report, line) }

        groups.where(employment_id:).any? do |group|
          group.in_flight_legs.any? do |leg|
            retained = leg.payroll_revision.payroll_payload.fetch("lines").find { |entry| entry["employment_id"] == employment_id }
            leg.intact? && leg.company_id == @run.company_id && leg.payroll_run_id == @run.id && retained &&
              self.class.same_line?(retained, line) &&
              PayrollPaymentGroup.line_digest(retained) == PayrollPaymentGroup.line_digest(line)
          end
        end
      rescue NoMethodError, KeyError, TypeError
        false
      end

      def protected_india_report?(handoff, line)
        retained = handoff.report.fetch("line")
        self.class.same_line?(retained, line) && IndiaHandoff.line_digest(retained) == handoff.line_digest
      end

      def groups
        PayrollPaymentGroup.where(payroll_run_id: @run.id)
      end

      def in_flight_groups
        groups.select { |group| group.in_flight_legs.exists? }
      end

      def india_handoffs
        PayrollIndiaHandoff.active.where(payroll_run_id: @run.id)
      end

      def protected_india_handoffs
        india_handoffs.joins(:payroll_india_deliveries).where(payroll_india_deliveries: { state: %w[sending sent uncertain] }).distinct
      end

      def void_prepared_legs(actor)
        PayrollPaymentInstruction.open_slot.where(payroll_run_id: @run.id, submission_state: "prepared").find_each do |leg|
          leg.update!(submission_state: "voided", released_at: Time.current)
          leg.payroll_payment_events.create!(kind: "voided_by_new_revision", actor:, data: {})
        end
      end

      def release_reservations
        protected_employment_ids = in_flight_groups.map(&:employment_id) + india_handoffs.pluck(:employment_id)
        PayrollExpenseReservation.unsettled.where(payroll_run_id: @run.id).where.not(employment_id: protected_employment_ids)
          .find_each { |reservation| reservation.update!(released_at: Time.current) }
        PtoRecovery.release!(@run, protected_employment_ids:)
      end
  end
end
