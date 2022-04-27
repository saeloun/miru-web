# frozen_string_literal: true

class SubscriptionsController < ApplicationController
  def index
    authorize :index, policy_class: SubscriptionsPolicy
  end
end
