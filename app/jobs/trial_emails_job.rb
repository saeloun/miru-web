# frozen_string_literal: true

class TrialEmailsJob < ApplicationJob
  queue_as :default

  ONBOARDING_EMAILS = { 2 => :trial_getting_started, 5 => :trial_pro_features }.freeze
  ENDING_REMINDER_DAYS = [7, 2, 1].freeze

  # Self-hosted instances without Stripe pricing have no upgrade path, so
  # trial emails would only nag admins about a checkout that cannot succeed.
  def self.billing_configured?
    ENV["STRIPE_PLAN_PAGE_URL"].present? ||
      ENV["STRIPE_SUBSCRIPTION_PRICE_ID"].present? ||
      ENV["STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY"].present? ||
      ENV["STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY"].present?
  end

  def perform
    return unless self.class.billing_configured?

    companies_on_trial.find_each do |company|
      process_company(company)
    rescue StandardError => e
      Rails.logger.error("TrialEmailsJob: company=#{company.id} failed: #{e.class}: #{e.message}")
    end
  end

  private

    def companies_on_trial
      Company.where(billing_exempt: false)
        .where.not(plan_tier: "paid")
        .where.not(trial_started_at: nil)
        .where("trial_ends_at > ?", Time.current)
    end

    def process_company(company)
      today = Time.current.in_time_zone(company.resolved_time_zone).to_date
      email, days_remaining = due_email(company, today)
      return if email.blank?

      deliver_once(company, email, days_remaining, today)
    end

    def due_email(company, today)
      zone = company.resolved_time_zone
      trial_end = company.trial_ends_at.in_time_zone(zone).to_date
      days_remaining = (trial_end - today).to_i

      threshold = ENDING_REMINDER_DAYS.find do |days|
        days_remaining <= days && !reminder_sent_within?(company, trial_end, days)
      end
      return [:trial_ending_reminder, days_remaining] if threshold

      days_since_start = (today - company.trial_started_at.in_time_zone(zone).to_date).to_i
      [ONBOARDING_EMAILS[days_since_start], days_remaining]
    end

    # A reminder threshold counts as covered once any trial email went out on a
    # day with that many (or fewer) days left. A job run missed at 09:00 (deploy,
    # outage) then catches up on the next run instead of dropping the reminder.
    def reminder_sent_within?(company, trial_end, days)
      last_sent_on = company.trial_email_last_sent_on
      last_sent_on.present? && (trial_end - last_sent_on).to_i <= days
    end

    # The lock and date stamp make this idempotent per company/day, even if the
    # scheduled job is triggered multiple times across environments. The stamp
    # records "attempted": delivery failures surface in Solid Queue failed
    # executions, not here.
    def deliver_once(company, email, days_remaining, today)
      company.with_lock do
        return if company.trial_email_last_sent_on == today

        recipients(company).each do |user|
          mailer_params = { company_id: company.id, recipient_id: user.id }
          mailer_params[:days_remaining] = days_remaining if email == :trial_ending_reminder

          SubscriptionMailer.with(**mailer_params).public_send(email).deliver_later
          Rails.logger.info(
            "TrialEmailsJob: sent=#{email} company=#{company.id} user=#{user.id} days_remaining=#{days_remaining}"
          )
        end

        company.update!(trial_email_last_sent_on: today)
      end
    end

    def recipients(company)
      unsubscribed_user_ids = NotificationPreference
        .where(company_id: company.id, unsubscribed_from_all: true)
        .select(:user_id)

      company.users.kept
        .joins(:roles)
        .where(roles: { name: %w[owner admin], resource_type: "Company", resource_id: company.id })
        .where.not(email: [nil, ""])
        .where.not(id: unsubscribed_user_ids)
        .distinct
    end
end
