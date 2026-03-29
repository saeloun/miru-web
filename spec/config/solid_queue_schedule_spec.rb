# frozen_string_literal: true

require "rails_helper"
require "yaml"
require "erb"

RSpec.describe "Solid Queue schedule" do
  let(:config) do
    YAML.safe_load(
      ERB.new(Rails.root.join("config/solid_queue.yml").read).result,
      aliases: true
    )
  end

  it "runs daily Stripe subscription reconciliation in default and production" do
    default_task = config.dig("default", "dispatchers", 0, "recurring_tasks", "sync_stripe_subscriptions")
    production_task = config.dig("production", "dispatchers", 0, "recurring_tasks", "sync_stripe_subscriptions")

    expect(default_task).to include(
      "class" => "SyncStripeSubscriptionsJob",
      "schedule" => "0 1 * * *"
    )
    expect(production_task).to include(
      "class" => "SyncStripeSubscriptionsJob",
      "schedule" => "0 1 * * *"
    )
  end

  it "runs database backups every 30 minutes in production by default" do
    production_task = config.dig("production", "dispatchers", 0, "recurring_tasks", "database_backup")

    expect(production_task).to include(
      "class" => "DatabaseBackupJob",
      "schedule" => "*/30 * * * *"
    )
  end
end
