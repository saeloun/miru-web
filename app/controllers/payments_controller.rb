# frozen_string_literal: true

class PaymentsController < ApplicationController
  skip_after_action :verify_authorized

  def index
  end
end
