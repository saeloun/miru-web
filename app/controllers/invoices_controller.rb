# frozen_string_literal: true

class InvoicesController < ApplicationController
  def index
    authorize :invoice
  end
end
