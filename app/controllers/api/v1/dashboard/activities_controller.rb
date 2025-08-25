# frozen_string_literal: true

class Api::V1::Dashboard::ActivitiesController < Api::V1::ApplicationController
  after_action :verify_authorized, except: :index

  def index
    activities = fetch_activities

    render json: {
      activities: activities,
      has_more: activities.length == per_page,
      total_count: total_activity_count
    }
  rescue => e
    Rails.logger.error "Activities API Error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")

    render json: {
      activities: [],
      has_more: false,
      total_count: 0,
      error: "Failed to fetch activities"
    }, status: 500
  end

  private

    def fetch_activities
      offset_value = params[:offset].to_i
      limit_value = per_page

      # Get recent invoice activities
      invoice_activities = current_company.invoices
        .includes(:client)
        .where.not(status: :draft)
        .order(updated_at: :desc)
        .limit(limit_value * 2) # Get more to account for filtering
        .offset(offset_value)
        .filter_map { |invoice| format_invoice_activity(invoice) }


      # Get recent payment activities
      payment_activities = current_company.invoices
        .joins(:payments)
        .includes(:payments, :client)
        .order("payments.created_at DESC")
        .limit(limit_value * 2) # Get more to account for filtering
        .offset(offset_value)
        .flat_map { |invoice| format_payment_activities(invoice) }
        .compact

      # Combine, sort by timestamp, and limit
      all_activities = (invoice_activities + payment_activities)
        .sort_by { |activity| -activity[:timestamp] }
        .first(limit_value)

      all_activities
    end

    def format_invoice_activity(invoice)
      return nil unless invoice&.client&.name

      action = case invoice.status&.to_s
               when "sent"
                 "sent"
               when "viewed"
                 "viewed"
               when "paid"
                 "marked as paid"
               else
                 "updated"
      end

      {
        id: "invoice_#{invoice.id}",
        type: "invoice",
        message: "Invoice ##{invoice.invoice_number || invoice.id} #{action} to #{invoice.client.name}",
        timestamp: invoice.updated_at.to_i,
        time_ago: time_ago_in_words(invoice.updated_at),
        icon: "FileText",
        metadata: {
          invoice_id: invoice.id,
          client_name: invoice.client.name,
          amount: invoice.amount&.to_f || 0.0,
          currency: invoice.currency || current_company&.base_currency || "USD",
          status: invoice.status
        }
      }
    rescue => e
      Rails.logger.error "Error formatting invoice activity: #{e.message}"
      nil
    end

    def format_payment_activities(invoice)
      return [] unless invoice&.client&.name && invoice.payments.present?

      invoice.payments.filter_map do |payment|
        next nil unless payment.amount && payment.created_at

        currency = payment.payment_currency || invoice.currency || current_company&.base_currency || "USD"

        {
          id: "payment_#{payment.id}",
          type: "payment",
          message: "Payment of #{currency} #{payment.amount} received from #{invoice.client.name}",
          timestamp: payment.created_at.to_i,
          time_ago: time_ago_in_words(payment.created_at),
          icon: "CurrencyDollar",
          metadata: {
            payment_id: payment.id,
            invoice_id: invoice.id,
            client_name: invoice.client.name,
            amount: payment.amount&.to_f || 0.0,
            currency: currency,
            status: payment.status
          }
        }
      end
    rescue => e
      Rails.logger.error "Error formatting payment activities: #{e.message}"
      []
    end

    def per_page
      params[:per_page]&.to_i || 20
    end

    def total_activity_count
      invoice_count = current_company.invoices.where.not(status: :draft).count
      payment_count = Payment.joins(invoice: :company).where(invoice: { company: current_company }).count
      invoice_count + payment_count
    rescue => e
      Rails.logger.error "Error calculating activity count: #{e.message}"
      0
    end

    def time_ago_in_words(time)
      distance = Time.current - time

      case distance
      when 0..59
        "just now"
      when 60..3599
        "#{(distance / 60).to_i} minutes ago"
      when 3600..86399
        "#{(distance / 3600).to_i} hours ago"
      when 86400..604799
        "#{(distance / 86400).to_i} days ago"
      else
        time.strftime("%B %d, %Y")
      end
    end
end
