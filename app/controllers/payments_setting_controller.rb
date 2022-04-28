# frozen_string_literal: true

class PaymentsSettingController < ApplicationController
  def index
    authorize :index, policy_class: PaymentSettingPolicy
  end
end
