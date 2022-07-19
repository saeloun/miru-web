# frozen_string_literal: true

class TeamController < ApplicationController
  skip_after_action :verify_authorized, only: :index

  def index
    render
  end
end
