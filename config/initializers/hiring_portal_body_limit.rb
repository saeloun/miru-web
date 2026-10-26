# frozen_string_literal: true

require "stringio"

class HiringPortalBodyLimit
  def initialize(app)
    @app = app
  end

  def call(env)
    path = env["PATH_INFO"].to_s
    return @app.call(env) unless env["REQUEST_METHOD"] == "POST" && path.start_with?("/hiring-form/", "/hiring-assignment/")

    maximum = path.match?(%r{\A/(?:hiring-form/resume|hiring-assignment/files)(?:\.[^/]+)?\z}) ? 6 * 1024 * 1024 : 128 * 1024
    return too_large if env["CONTENT_LENGTH"].to_i > maximum

    input = env["rack.input"]
    body = +"".b
    while input && (chunk = input.read([16 * 1024, maximum + 1 - body.bytesize].min)) && !chunk.empty?
      body << chunk
      return too_large if body.bytesize > maximum
    end
    env["rack.input"] = StringIO.new(body)
    env["CONTENT_LENGTH"] = body.bytesize.to_s
    @app.call(env)
  end

  private

    def too_large
      [413, { "content-type" => "application/json", "cache-control" => "private, no-store",
              "referrer-policy" => "no-referrer", "x-content-type-options" => "nosniff" },
        ['{"errors":"The application form request is too large."}']]
    end
end

# Multipart parsing in Rack::MethodOverride precedes controller callbacks.
Rails.application.config.middleware.insert_before EncodingSanitizer, HiringPortalBodyLimit
