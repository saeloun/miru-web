# frozen_string_literal: true

class SubscriptionMailer < ApplicationMailer
  def trial_started
    load_trial_context

    mail(
      to: @recipient.email,
      subject: "Your Miru Pro trial is active",
      reply_to: default_reply_to_address
    )
  end

  def trial_getting_started
    load_trial_context

    mail(
      to: @recipient.email,
      subject: "Make the most of your Miru Pro trial",
      reply_to: default_reply_to_address
    )
  end

  def trial_pro_features
    load_trial_context

    mail(
      to: @recipient.email,
      subject: "See what your team keeps with Miru Pro",
      reply_to: default_reply_to_address
    )
  end

  def trial_ending_reminder
    load_trial_context
    @days_remaining = params[:days_remaining].to_i

    subject =
      if @days_remaining <= 1
        "Your Miru Pro trial ends tomorrow"
      else
        "Your Miru Pro trial ends in #{@days_remaining} days"
      end

    mail(
      to: @recipient.email,
      subject:,
      reply_to: default_reply_to_address
    )
  end

  def plan_purchased
    @company = Company.find(params[:company_id])
    @alert_email = params[:alert_email].presence
    @plan_label = params[:plan_label].presence || @company.current_plan_label.to_s.humanize.titleize
    @display_plan_label = @plan_label == "Paid" ? "Miru Pro" : @plan_label
    @stripe_subscription_id = params[:stripe_subscription_id]
    @subscription_interval = params[:subscription_interval].presence || "month"
    @seat_quantity = params[:seat_quantity].presence || @company.billable_team_seats
    @billing_url = params[:billing_url].presence || "#{ENV['APP_BASE_URL']}/settings/billing"

    mail(
      to: @alert_email,
      subject: "Cha-ching! #{@company.name} bought #{@display_plan_label}",
      reply_to: default_reply_to_address
    )
  end

  private

    def load_trial_context
      @company = Company.find(params[:company_id])
      @recipient = User.find(params[:recipient_id])
      @trial_ends_at = @company.trial_ends_at
      @trial_end_date_text = @trial_ends_at&.in_time_zone(resolved_time_zone)&.strftime("%B %-d, %Y")
      @app_url = ENV["APP_BASE_URL"]
      @billing_url = "#{ENV['APP_BASE_URL']}/settings/billing"
    end

    def resolved_time_zone
      @company.resolved_time_zone
    end
end
