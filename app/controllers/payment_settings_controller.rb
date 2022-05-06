# frozen_string_literal: true

class PaymentSettingsController < ApplicationController
  def index
    authorize :index, policy_class: PaymentSettingsPolicy
  end

  def connect_stripe
    authorize :connect_stripe, policy_class: PaymentSettingsPolicy
  end
end
