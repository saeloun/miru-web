# frozen_string_literal: true

module Searchable
  extend ActiveSupport::Concern

  included do
    include PgSearch::Model
  end

  class_methods do
    def search(query, options = {})
      if options[:fields].present? && query.present?
        fields = Array(options[:fields])
        conditions = fields.map do |field|
          "#{table_name}.#{field} ILIKE ?"
        end.join(" OR ")
        search_term = "%#{sanitize_sql_like(query)}%"
        results = where(conditions, *Array.new(fields.size, search_term))
      elsif query.blank? || query == "*"
        results = all
      elsif respond_to?(:pg_search) && query.present?
        results = pg_search(query)
      elsif column_names.include?("name")
        results = where("name ILIKE ?", "%#{sanitize_sql_like(query)}%")
      else
        results = all
      end

      if options[:where].present?
        options[:where].each do |key, value|
          results = if value.is_a?(Hash) && value.key?(:not)
            results.where.not(key => value[:not])
          else
            results.where(key => value)
          end
        end
      end

      if options[:includes].present?
        results = results.includes(options[:includes])
      end

      if options[:order].present?
        results = results.order(options[:order])
      end

      if options[:limit].present?
        results = results.limit(options[:limit].to_i)
      elsif options[:page].present?
        page = [options[:page].to_i, 1].max  # Ensure page is at least 1
        per_page = (options[:per_page] || options[:per] || 25).to_i
        per_page = [per_page, 1].max  # Ensure per_page is at least 1
        results = results.limit(per_page).offset((page - 1) * per_page)
      end

      results
    end

    def fuzzy_search(query, options = {})
      options[:threshold] || 0.3

      if respond_to?(:pg_search) && query.present?
        pg_search(query)
      elsif column_names.include?("name")
        where("name ILIKE ?", "%#{sanitize_sql_like(query)}%")
      elsif column_names.include?("invoice_number")
        where("invoice_number ILIKE ?", "%#{sanitize_sql_like(query)}%")
      else
        all
      end
    end
  end
end
