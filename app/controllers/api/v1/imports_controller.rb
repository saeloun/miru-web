# frozen_string_literal: true

class Api::V1::ImportsController < Api::V1::ApplicationController
  MAX_FILE_SIZE = 20.megabytes
  MAX_USER_MAPPINGS = 500

  rescue_from Imports::HarvestTimeEntriesImporter::InvalidFileError, JSON::ParserError, with: :render_invalid_import

  def create
    authorize DataImport
    validate_file!
    Imports::HarvestTimeEntriesImporter.validate_headers!(params[:file].tempfile.path)

    data_import = current_company.data_imports.create!(
      user: current_user,
      source: params[:source],
      kind: params[:kind].presence || "time_entries",
      dry_run: ActiveModel::Type::Boolean.new.cast(params.fetch(:dry_run, false)),
      options: import_options
    )
    data_import.file.attach(params[:file])

    DataImportJob.perform_later(data_import.id)
    render json: serialized(data_import), status: 202
  end

  def show
    data_import = policy_scope(DataImport).find(params[:id])
    authorize data_import
    render json: serialized(data_import), status: 200
  end

  private

    def validate_file!
      file = params[:file]
      unless file.respond_to?(:tempfile) && file.respond_to?(:original_filename)
        raise Imports::HarvestTimeEntriesImporter::InvalidFileError, I18n.t("imports.errors.file_required")
      end
      unless File.extname(file.original_filename).casecmp?(".csv")
        raise Imports::HarvestTimeEntriesImporter::InvalidFileError, I18n.t("imports.errors.csv_required")
      end
      if file.size > MAX_FILE_SIZE
        raise Imports::HarvestTimeEntriesImporter::InvalidFileError, I18n.t("imports.errors.file_too_large")
      end
    end

    def import_options
      {
        "user_map" => parsed_user_map,
        "assign_unmatched_to" => params[:assign_unmatched_to].presence
      }.compact
    end

    def parsed_user_map
      value = params[:user_map]
      return {} if value.blank?
      if value.is_a?(String) && value.lstrip.start_with?("{", "[")
        parsed = JSON.parse(value)
        unless valid_user_map?(parsed)
          raise Imports::HarvestTimeEntriesImporter::InvalidFileError, I18n.t("imports.errors.invalid_user_map")
        end

        return parsed
      end

      mappings = Array(value)
      if mappings.size > MAX_USER_MAPPINGS
        raise Imports::HarvestTimeEntriesImporter::InvalidFileError, I18n.t("imports.errors.invalid_user_map")
      end

      mappings.to_h do |mapping|
        unless mapping.is_a?(String)
          raise Imports::HarvestTimeEntriesImporter::InvalidFileError, I18n.t("imports.errors.invalid_user_map")
        end
        name, email = mapping.to_s.split("=", 2).map(&:strip)
        unless name.present? && email.present?
          raise Imports::HarvestTimeEntriesImporter::InvalidFileError, I18n.t("imports.errors.invalid_user_map")
        end
        [name, email]
      end
    end

    def valid_user_map?(user_map)
      user_map.is_a?(Hash) && user_map.size <= MAX_USER_MAPPINGS && user_map.all? do |name, email|
        name.is_a?(String) && email.is_a?(String) && name.present? && email.present?
      end
    end

    def render_invalid_import(error)
      render json: { errors: error.message }, status: :unprocessable_entity
    end

    def serialized(data_import)
      data_import.as_json(only: [
        :id,
        :source,
        :kind,
        :status,
        :dry_run,
        :total_rows,
        :imported_rows,
        :failed_rows,
        :skipped_rows,
        :summary,
        :error_message,
        :started_at,
        :finished_at
      ]).merge("row_errors" => data_import.row_errors.first(50))
    end
end
