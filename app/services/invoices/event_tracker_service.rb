# frozen_string_literal: true

class Invoices::EventTrackerService < ApplicationService
  attr_reader :event_type, :invoice, :extra_data, :ahoy

  def initialize(event_type, invoice, extra_data = nil)
    @event_type = event_type
    @invoice = invoice
    @extra_data = extra_data
    @ahoy = Ahoy.instance
  end

  def process
    send("handle_#{event_type}_action")
  end

  private

    def handle_create_action
      add_event("create_invoice")
    end

    def handle_view_action
      add_event("view_invoice")
      end

    def handle_update_action
      add_event("update_invoice")
    end

    def handle_destroy_action
      add_event("delete_invoice")
    end

    def handle_send_invoice_action
      add_event("send_invoice", { emails: extra_data[:invoice_email][:recipients] })
    end

    def handle_download_action
      add_event("download_invoice")
    end

    def handle_payment_action
      if extra_data[:mode] == :stripe
        add_event("pay_invoice", { mode: :stripe, customer: extra_data[:customer] })
      else
        add_event("pay_invoice")
      end
    end

    def add_event(event_name, optional_data = {})
      event_data = { type: :invoice, id: invoice.id }.merge!(optional_data)
      ahoy.track event_name, event_data
    end
end
