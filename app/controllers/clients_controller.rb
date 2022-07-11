# frozen_string_literal: true

# delete file

class ClientsController < ApplicationController
  def index
    authorize :index, policy_class: ClientPolicy
  end

  private

    def clients
      @_clients ||= current_company.clients.kept.order(created_at: :desc).map do |c|
        c.attributes.merge({ hours_logged: c.timesheet_entries.sum(:duration) })
      end
    end
end
