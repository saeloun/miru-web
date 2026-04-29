# frozen_string_literal: true

class Team::RemovalImpactService < ApplicationService
  attr_reader :current_company, :member

  def initialize(current_company:, member:)
    @current_company = current_company
    @member = member
  end

  def process
    {
      project_assignments_count: project_assignments.count,
      project_names: project_assignments.map { |assignment| assignment.project.name }.uniq,
      unbilled_entries_count: unbilled_entries.count,
      unbilled_minutes: unbilled_minutes,
      uninvoiced_amount: estimated_uninvoiced_amount,
      invoiced_entries_count: invoiced_entries_count,
      has_risk: project_assignments.exists? || unbilled_entries.exists?
    }
  end

  private

    def project_assignments
      @_project_assignments ||= member.project_members.kept
        .joins(project: :client)
        .where(clients: { company_id: current_company.id })
        .includes(:project)
    end

    def workspace_entries
      @_workspace_entries ||= member.timesheet_entries.kept.in_workspace(current_company)
    end

    def unbilled_entries
      @_unbilled_entries ||= workspace_entries.unbilled
    end

    def unbilled_minutes
      @_unbilled_minutes ||= unbilled_entries.sum(:duration).to_f
    end

    def invoiced_entries_count
      @_invoiced_entries_count ||= workspace_entries.billed.count
    end

    def estimated_uninvoiced_amount
      rates_by_project_id = project_assignments.pluck(:project_id, :hourly_rate).to_h

      unbilled_entries.pluck(:project_id, :duration).sum do |project_id, duration|
        (duration.to_f / 60.0) * rates_by_project_id.fetch(project_id, 0).to_f
      end.round(2)
    end
end
