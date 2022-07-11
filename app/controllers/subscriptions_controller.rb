# frozen_string_literal: true

# Delete_File
class SubscriptionsController < ApplicationController
  def index
    authorize :index, policy_class: SubscriptionsPolicy
  end
end
