# frozen_string_literal: true

class PaymentsController < ApplicationController
  def index
    authorize :index, policy_class: PaymentPolicy
  end
end
