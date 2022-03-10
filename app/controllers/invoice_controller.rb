class InvoiceController < ApplicationController
    skip_after_action :verify_authorized, except: :create
end