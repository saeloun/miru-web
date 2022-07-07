# frozen_string_literal: true

class InternalApi::V1::Payments::InvoicesController < ApplicationController
  def create
    authorize :create, policy_class: Payments::InvoicePolicy
    render :index, locals: {}, status: :ok
  end
end
