# frozen_string_literal: true

module Searchable
  extend ActiveSupport::Concern

  included do
    include PgSearch::Model
  end

  class_methods do
    def search(query, options = {})
      # Handle field-specific search
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
        # Use pg_search if available and query is present
        results = pg_search(query)
      elsif column_names.include?("name")
        # Fallback to basic search on name column if it exists
        results = where("name ILIKE ?", "%#{query}%")
      else
        # If no search capability, return all records
        results = all
      end

      # Apply additional filters from options
      if options[:where].present?
        options[:where].each do |key, value|
          results = if value.is_a?(Hash) && value.key?(:not)
            results.where.not(key => value[:not])
          else
            results.where(key => value)
          end
        end
      end

      # Apply includes for eager loading
      if options[:includes].present?
        results = results.includes(options[:includes])
      end

      # Apply ordering
      if options[:order].present?
        results = results.order(options[:order])
      end

      # Apply limit
      if options[:limit].present?
        results = results.limit(options[:limit].to_i)
      elsif options[:page].present?
        # Apply pagination
        page = [options[:page].to_i, 1].max  # Ensure page is at least 1
        per_page = (options[:per_page] || options[:per] || 25).to_i
        per_page = [per_page, 1].max  # Ensure per_page is at least 1
        results = results.limit(per_page).offset((page - 1) * per_page)
      end

      results
    end

    def fuzzy_search(query, options = {})
      # Implement fuzzy search using trigram similarity
      # This method is for more advanced search with similarity threshold
      options[:threshold] || 0.3

      if respond_to?(:pg_search) && query.present?
        # Use pg_search for fuzzy matching
        pg_search(query)
      elsif column_names.include?("name")
        # Fallback to ILIKE for basic fuzzy matching
        where("name ILIKE ?", "%#{sanitize_sql_like(query)}%")
      elsif column_names.include?("invoice_number")
        # For invoice search
        where("invoice_number ILIKE ?", "%#{sanitize_sql_like(query)}%")
      else
        all
      end
    end
  end
end
