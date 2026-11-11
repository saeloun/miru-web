# frozen_string_literal: true

require "rails_helper"
require "yaml"
require "erb"

RSpec.describe "Solid Queue schedule" do
  it "runs explicitly approved hiring retention daily in default and production" do
    %w[default production].each do |environment|
      task = config.dig(environment, "dispatchers", 0, "recurring_tasks", "hiring_retention")
      expect(task).to include("class" => "HiringRetentionJob", "schedule" => "37 3 * * *")
    end
  end

  it "expires issued hiring offers in default and production" do
    %w[default production].each do |environment|
      task = config.dig(environment, "dispatchers", 0, "recurring_tasks", "hiring_offer_expiry")
      expect(task).to include("class" => "HiringOfferExpiryJob", "schedule" => "4-59/5 * * * *")
    end
  end
  it "reconciles missing interview feedback requests in default and production" do
    %w[default production].each do |environment|
      task = config.dig(environment, "dispatchers", 0, "recurring_tasks", "hiring_feedback_requests")
      expect(task).to include("class" => "HiringFeedbackRequestsJob", "schedule" => "2-59/5 * * * *")
    end
  end
  it "queues approved decision notices in default and production" do
    %w[default production].each do |environment|
      task = config.dig(environment, "dispatchers", 0, "recurring_tasks", "hiring_decision_notifications")
      expect(task).to include("class" => "HiringDecisionNotificationsJob", "schedule" => "3-59/5 * * * *")
    end
  end

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

  it "runs monthly report delivery on the first day of the month in default and production" do
    default_task = config.dig("default", "dispatchers", 0, "recurring_tasks", "monthly_reports_delivery")
    production_task = config.dig("production", "dispatchers", 0, "recurring_tasks", "monthly_reports_delivery")

    expect(default_task).to include(
      "class" => "MonthlyReportsDeliveryJob",
      "schedule" => "0 14 1 * * Asia/Kolkata"
    )
    expect(production_task).to include(
      "class" => "MonthlyReportsDeliveryJob",
      "schedule" => "0 14 1 * * Asia/Kolkata"
    )
  end

  it "runs analytics threshold notifications weekly on Monday at 1 AM Eastern" do
    default_task = config.dig("default", "dispatchers", 0, "recurring_tasks", "analytics_threshold_notifications")
    production_task = config.dig("production", "dispatchers", 0, "recurring_tasks", "analytics_threshold_notifications")

    expect(default_task).to include(
      "class" => "Analytics::ThresholdNotificationsJob",
      "schedule" => "0 1 * * 1 America/New_York"
    )
    expect(production_task).to include(
      "class" => "Analytics::ThresholdNotificationsJob",
      "schedule" => "0 1 * * 1 America/New_York"
    )
  end

  it "runs database backups every 30 minutes in production by default" do
    production_task = config.dig("production", "dispatchers", 0, "recurring_tasks", "database_backup")

    expect(production_task).to include(
      "class" => "DatabaseBackupJob",
      "schedule" => "*/30 * * * *"
    )
  end

  it "runs purchase delivery recovery every 10 minutes in default and production" do
    %w[default production].each do |environment|
      task = config.dig(environment, "dispatchers", 0, "recurring_tasks", "subscription_purchase_delivery_recovery")

      expect(task).to include("class" => "SubscriptionPurchaseDeliveryRecoveryJob", "schedule" => "*/10 * * * *")
    end
  end

  it "runs hiring delivery recovery every 5 minutes alongside purchase recovery" do
    %w[default production].each do |environment|
      task = config.dig(environment, "dispatchers", 0, "recurring_tasks", "hiring_delivery_recovery")

      expect(task).to include("class" => "HiringDeliveryRecoveryJob", "schedule" => "*/5 * * * *")
    end
  end

  it "maintains Razorpay OAuth tokens daily in default and production" do
    %w[default production].each do |environment|
      task = config.dig(environment, "dispatchers", 0, "recurring_tasks", "refresh_razorpay_oauth_tokens")

      expect(task).to include("class" => "RefreshRazorpayOauthTokensJob", "schedule" => "23 3 * * *")
    end
  end

  it "recovers consultant invoice generation and delivery every five minutes in both schedules" do
    %w[default production].each do |environment|
      task = config.dig(environment, "dispatchers", 0, "recurring_tasks", "payroll_consultant_invoice_recovery")
      expect(task).to include("class" => "PayrollConsultantInvoiceRecoveryJob", "schedule" => "*/5 * * * *")
    end
  end

  it "keeps Mercury bank polling and Razorpay payment reconciliation in both schedules" do
    %w[default production].each do |environment|
      tasks = config.dig(environment, "dispatchers", 0, "recurring_tasks")

      expect(tasks.fetch("mercury_payroll_status_refresh")).to include("class" => "Payroll::MercuryStatusRefreshJob", "schedule" => "*/30 * * * *")
      expect(tasks.fetch("reconcile_razorpay_payment_links")).to include("class" => "ReconcileRazorpayPaymentLinksJob", "schedule" => "*/5 * * * *")
    end
  end
end
