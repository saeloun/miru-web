# frozen_string_literal: true

namespace :employee_ids do
  desc "Assign missing staff IDs for one company, attributed to a current administrator"
  task :backfill, [:company_id, :actor_id] => :environment do |_task, args|
    company = Company.find(args.fetch(:company_id))
    actor = User.kept.find(args.fetch(:actor_id))
    actor.current_workspace = company
    unless company.employments.kept.exists?(user: actor) && CompanyPolicy.new(actor, company).update?
      raise Pundit::NotAuthorizedError
    end

    assigned = 0
    skipped = 0
    company.with_employee_number_lock do |locked_company|
      locked_company.reserve_employee_number!
      company.employments.kept.where("employee_id IS NULL OR btrim(employee_id) = ''").order(:id).each do |employment|
        if employment.ensure_employee_id!.present?
          assigned += 1
        else
          skipped += 1
        end
      end
      Audited::Audit.create!(
        auditable: company, associated: company, user: actor, action: "update",
        audited_changes: { "employee_ids" => { "assigned" => assigned, "skipped" => skipped } },
        comment: "Missing staff employee IDs assigned"
      )
    end
    puts "assigned=#{assigned} skipped=#{skipped}"
  end
end
