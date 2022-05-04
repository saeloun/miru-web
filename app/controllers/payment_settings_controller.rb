# frozen_string_literal: true

class PaymentSettingsController < ApplicationController
  def index
    authorize :index, policy_class: PaymentSettingPolicy
  end
end
