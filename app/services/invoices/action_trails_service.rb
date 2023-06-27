# frozen_string_literal: true

class Invoices::ActionTrailsService < ApplicationService
  attr_reader :invoice_id, :events, :users, :trails, :payment_events, :payment_trails

  def initialize(invoice_id)
    @invoice_id = invoice_id
    @events = nil
    @payment_events = nil
    @users = {}
    @trails = []
    @payment_trails = []
  end

  def process
    fetch_events
    fetch_payment_events
    fetch_users
    generate_trails_from_events
    generate_trails_from_payment_events
  end

  private

    def fetch_events
      @events = Ahoy::Event.where_properties({ type: :invoice, id: invoice_id.to_i }).order({ time: :desc })
    end

    def fetch_payment_events
      invoice = Invoice.find_by(id: invoice_id)
      return [] if invoice.nil?

      @payment_events = invoice.payments.order(created_at: :desc)
    end

    def generate_trails_from_events
      events.each do |event|
        trails << generate_trail_from_event(event)
      end
    end

    def generate_trails_from_payment_events
      payment_events.each do |event|
        @payment_trails << generate_trail_from_payment_event(event)
      end
    end

    def generate_trail_from_event(event)
      case event.name
      when "create_invoice", "view_invoice", "update_invoice", "delete_invoice", "download_invoice"
        generic_trail_data(event)
      when "send_invoice"
        send_invoice_trail_data(event)
      when "pay_invoice"
        pay_invoice_trail_data(event)
      end
    end

    def generate_trail_from_payment_event(event)
      {
        type: event.status,
        name: event.name,
        note: event.note,
        amount: event.amount,
        created_at: event.created_at
      }
    end

    def generate_trail_hash
      [
        trails: @trails,
        payment_trails: @payment_trails
      ]
    end

    def fetch_users
      user_ids = events.pluck(:user_id)
      @users = User.where(id: user_ids)
        .includes(:avatar_attachment)
        .index_by(&:id)
    end

    def generic_trail_data(event)
      user_id = Integer(event.user_id)
      {
        type: event.name,
        user_name: users[user_id].full_name,
        user_avatar: users[user_id].avatar,
        created_at: event.time
      }
    end

    def send_invoice_trail_data(event)
      generic_trail_data(event).merge(emails: event.properties["emails"])
    end
end
