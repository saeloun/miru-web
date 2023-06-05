# frozen_string_literal: true

class Invoices::ActionTrailsService < ApplicationService
  attr_reader :invoice_id, :events, :users, :trails

  def initialize(invoice_id)
    @invoice_id = invoice_id
    @events = nil
    @users = {}
    @trails = []
  end

  def process
    fetch_events
    fetch_users
    generate_trails_from_events
  end

  private

    def fetch_events
      @events = Ahoy::Event.where_properties({ type: :invoice, id: invoice_id.to_i }).order({ time: :desc })
    end

    def generate_trails_from_events
      events.each do |event|
        @trails << generate_trail_from_event(event)
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

    def pay_invoice_trail_data(event)
      if event.properties["mode"] == "stripe"
        {
          type: event.name,
          user_name: event.properties["customer"]["name"],
          created_at: event.time,
          mode: "stripe",
          emails: [event.properties["customer"]["email"]]
        }
      else
        generic_trail_data(event)
      end
    end
end
