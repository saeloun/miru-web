# frozen_string_literal: true

# Delete_File

class PaymentsController < ApplicationController
  def index
    authorize :index, policy_class: PaymentPolicy
  end
end
