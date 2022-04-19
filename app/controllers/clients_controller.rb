# frozen_string_literal: true

class ClientsController < ApplicationController
  skip_after_action :verify_authorized, except: :create

  def index
    render :index, locals: {
      clients:,
      new_client: Client.new,
      keep_new_client_dialog_open: false
    }
  end

  private

    def clients
      @_clients ||= current_company.clients.kept.order(created_at: :desc).map do |c|
        c.attributes.merge({ hours_logged: c.timesheet_entries.sum(:duration) })
      end
    end
end
