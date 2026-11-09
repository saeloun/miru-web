# frozen_string_literal: true

class PayrollPtoReviewJob < ApplicationJob
  def perform(company_id = nil)
    ids = ConsultantPtoPolicy.distinct.select(:company_id)
    companies = Company.where(id: company_id || ids)
    companies.find_each do |company|
      next unless Payroll::Entitlement.enabled?(company.id)

      today = company.resolved_time_zone.today
      memberships = company.employments.kept.where(joined_at: ..today).where("resigned_at IS NULL OR resigned_at >= ?", today).select(:user_id)
      recipients = User.kept.where(id: memberships).joins(:roles)
        .where(roles: { resource_type: "Company", resource_id: company.id, name: %w[owner admin] }).distinct.to_a
      next if recipients.empty?

      ConsultantPtoPolicy.where(company:).distinct.pluck(:employment_id).each do |employment_id|
        employment = company.employments.find(employment_id)
        begin
          Payroll::PtoLedger.new(employment, actor: recipients.first).accrue!(through: today, scheduled: true)
        rescue Payroll::Workflow::Conflict
          # A frozen in-flight report remains authoritative; show pending accrual for review.
        end
      end
      as_of = today.prev_month.end_of_month
      rows = Payroll::PtoReport.new(company, as_of:).call.fetch(:cases)
      rows += Payroll::PtoReport.new(company, as_of: today).call.fetch(:cases).select { |row| row[:exit_review] || row[:year_end_review] }
      rows.each do |row|
        kinds = []
        kinds << "threshold" if row[:threshold_review]
        kinds << "year_end" if row[:year_end_review] && (row[:historical_negative_hours].to_d.positive? || row[:deferred_cases].any?)
        kinds << "exit" if row[:exit_review]
        kinds << "correction" if row[:deferred_cases].any? { |entry| entry[:kind].include?("correction") }
        kinds.each do |kind|
          targets = recipients
          membership = company.employments.find(row[:employment_id])
          employee = membership.user
          active_payee = !membership.discarded? && membership.joined_at && membership.joined_at <= today && (membership.resigned_at.nil? || membership.resigned_at >= today)
          targets += [employee] if kind == "correction" && !employee.discarded? && active_payee
          # Threshold and correction follow case versions; annual/exit identities stay stable within their review boundary.
          version = row.slice(:deferred_cases, :historical_negative_hours, :cash_cases)
          version[:year_end_review_on] = row[:year_end_review_on] if kind == "year_end"
          version[:leave_year_start] = row[:leave_year_start] if kind == "exit"
          if kind == "threshold" && row.dig(:facts, "unresolved_hours").to_d.positive?
            version[:unresolved] = row.fetch(:facts).slice("month", "decision_id", "gap_hours", "unresolved_hours")
          end
          digest = Digest::SHA256.hexdigest(JSON.generate(version))
          targets.uniq(&:id).each do |recipient|
            notice = PayrollPtoNotification.create_or_find_by!(company:, employment_id: row[:employment_id], recipient:, kind:, source_digest: digest)
            PayrollPtoNoticeJob.perform_later(notice.id) if notice.state == "queued"
          end
        end
      end
    end
    PayrollPtoNotification.where(state: "sending", attempted_at: ..15.minutes.ago).update_all(state: "uncertain")
  end
end
