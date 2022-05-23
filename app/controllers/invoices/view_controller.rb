# frozen_string_literal: true

class Invoices::ViewController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def show
    render :show, layout: false
  end
end
