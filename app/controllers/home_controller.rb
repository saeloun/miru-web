# frozen_string_literal: true

class HomeController < ApplicationController
  skip_before_action :authenticate_user!, :validate_company!
  skip_after_action :verify_authorized

  def index
    render
  end
end
