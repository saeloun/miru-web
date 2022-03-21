# frozen_string_literal: true

class TimesheetEntry::BulkActionPolicy < TimesheetEntryPolicy
  class Scope < Scope
    def resolve
      if user.has_owner_or_admin?
        scope.all
      else
        scope.where(company: user.current_workspace)
      end
    end
  end
end
