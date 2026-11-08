# frozen_string_literal: true

module Payroll
  class MercuryRevisionGuard
    def initialize(run)
      @run = run
    end

    def check!(payload)
      india_handoffs.find_each do |handoff|
        line = payload["lines"].find { |entry| entry["employment_id"] == handoff.employment_id }
        next if line && IndiaHandoff.line_digest(line) == handoff.line_digest

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

    private

      def groups
        PayrollPaymentGroup.where(payroll_run_id: @run.id)
      end

      def in_flight_groups
        groups.select { |group| group.in_flight_legs.exists? }
      end

      def india_handoffs
        PayrollIndiaHandoff.active.where(payroll_run_id: @run.id)
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
