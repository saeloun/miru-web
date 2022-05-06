# frozen_string_literal: true

class PaymentSettingsController < ApplicationController
  def index
    authorize :index, policy_class: PaymentSettingsPolicy
  end
end
