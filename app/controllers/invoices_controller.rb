# frozen_string_literal: true

# delete_file

class InvoicesController < ApplicationController
  def index
    authorize :invoice
  end
end
