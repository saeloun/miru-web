# frozen_string_literal: true

FactoryBot.define do
  factory :desktop_current_timer do
    company
    user
    current_timer do
      {
        billable: false,
        elapsed_ms: 60_000,
        notes: "Desktop timer",
        project_name: "Miru / Desktop",
        running: true,
        started_at: Time.current.iso8601(3),
        task_name: "Development"
      }
    end
  end
end
