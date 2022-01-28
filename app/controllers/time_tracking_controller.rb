# frozen_string_literal: true

class TimeTrackingController < ApplicationController
  def index
    @is_admin = current_user
    # include projects of the client
    @clients = current_user.company.clients.includes(:projects)
    @projects = {}
    @clients.map do |c|
      @projects[c.name] = c.projects
    end

    render
  end
end
