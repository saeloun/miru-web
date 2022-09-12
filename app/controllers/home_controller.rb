# frozen_string_literal: true

class HomeController < ApplicationController
  def index
    @home_index = true
    authorize :index, policy_class: TeamPolicy

    render
  end
end
