# frozen_string_literal: true

module LeadTimeliness
  extend ActiveSupport::Concern

  included do
    after_commit on: [:create] do
      LeadTimelinessJob.perform_later(self.id, "create", self.previous_changes.as_json)
    end
    after_commit on: [:update] do
      LeadTimelinessJob.perform_later(self.id, "update", self.previous_changes.as_json)
    end
    after_commit on: [:destroy] do
      LeadTimelinessJob.perform_later(self.id, "destroy", self.previous_changes.as_json)
    end
  end
end
