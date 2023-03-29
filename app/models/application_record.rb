# frozen_string_literal: true

class ApplicationRecord < ActiveRecord::Base
  include ActionView::Helpers::TranslationHelper
  primary_abstract_class
end
