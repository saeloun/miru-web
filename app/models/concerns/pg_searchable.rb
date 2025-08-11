# frozen_string_literal: true

# PostgreSQL-based search using pg_trgm extension for fuzzy matching
# Following Ankane's approach of using native PostgreSQL features
# Automatically searches all string/text columns in the model
module PgSearchable
  extend ActiveSupport::Concern

  included do
    scope :search, ->(query, options = {}) do
      scope = all

      # Handle search query
      unless query.blank? || query == "*"
        columns = options[:fields] || searchable_columns

        if database_supports_trigrams?
          # Use PostgreSQL trigram similarity for fuzzy matching
          scope = search_with_trigrams(scope, columns, query)
        else
          # Fallback to LIKE queries if trigrams not available
          scope = search_with_like(scope, columns, query)
        end
      end

      # Apply filters
      if options[:where].present?
        options[:where].each do |key, value|
          scope = if value.is_a?(Hash) && value.key?(:not)
            scope.where.not(key => value[:not])
          else
            scope.where(key => value)
          end
        end
      end

      # Apply ordering - if using trigrams, order by similarity score
      if options[:order].present?
        scope = scope.order(options[:order])
      elsif !query.blank? && query != "*" && database_supports_trigrams?
        # Order by relevance when using trigram search
        scope = scope.order(Arel.sql("similarity_score DESC"))
      end

      # Apply pagination
      if options[:page] && options[:per_page]
        offset = (options[:page].to_i - 1) * options[:per_page].to_i
        scope = scope.offset(offset).limit(options[:per_page])
      elsif options[:limit]
        scope = scope.limit(options[:limit])
      end

      scope = scope.includes(options[:includes]) if options[:includes]
      scope
    end

    # Fuzzy search using trigram similarity
    scope :fuzzy_search, ->(query, threshold: 0.3) do
      return all if query.blank?

      columns = searchable_columns
      return all if columns.empty?

      if database_supports_trigrams?
        search_with_trigrams(all, columns, query, threshold: threshold)
      else
        # Fallback to regular search if trigrams not available
        search(query)
      end
    end

    # Autocomplete suggestions using trigrams
    scope :autocomplete, ->(query, limit: 10) do
      fuzzy_search(query).limit(limit)
    end

    private

      def self.search_with_trigrams(scope, columns, query, threshold: 0.1)
        columns = Array(columns).map(&:to_s)
        return scope if columns.empty?

        conn = connection
        quoted_query = conn.quote(query)
        quoted_table = conn.quote_table_name(table_name)

        # Build similarity conditions
        similarity_conditions = columns.map do |col|
          quoted_col = conn.quote_column_name(col)
          "#{quoted_table}.#{quoted_col} % #{quoted_query}"
        end.join(" OR ")

        # Calculate similarity scores for ordering
        similarity_scores = columns.map do |col|
          quoted_col = conn.quote_column_name(col)
          "similarity(#{quoted_table}.#{quoted_col}, #{quoted_query})"
        end

        return scope.none if similarity_scores.empty?

        # Select with similarity score
        scope
          .select("#{quoted_table}.*, GREATEST(#{similarity_scores.join(", ")}) AS similarity_score")
          .where(similarity_conditions)
          .where("GREATEST(#{similarity_scores.join(", ")}) >= ?", threshold)
      end

      def self.search_with_like(scope, columns, query)
        return scope if columns.empty?

        conn = connection
        quoted_table = conn.quote_table_name(table_name)

        conditions = columns.map do |col|
          quoted_col = conn.quote_column_name(col)
          "LOWER(#{quoted_table}.#{quoted_col}::text) LIKE LOWER(:query)"
        end.join(" OR ")

        scope.where(conditions, query: "%#{query}%")
      end

      def self.database_supports_trigrams?
        @supports_trigrams ||= begin
          connection.select_value("SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'") == 1
        rescue
          false
        end
      end
  end

  class_methods do
    # Define which columns are searchable
    def searchable_columns(*columns)
      if columns.any?
        @searchable_columns = columns.map(&:to_s)
      else
        @searchable_columns ||= self.columns.filter_map do |column|
          column.name if [:string, :text].include?(column.type)
        end
      end
    end


    # Compatibility method for searchkick DSL
    def searchkick(options = {})
      # No-op for compatibility
    end
  end
end
