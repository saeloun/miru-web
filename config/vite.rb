# frozen_string_literal: true

module MiruViteExecutable
  private

    def vite_executable(*)
      paths = [config.vite_bin_path, config.root.join("node_modules/.bin/vite")].compact
      # A PATH fallback can resolve the Ruby vite shim and recursively spawn itself.
      unless paths.any? { |path| File.executable?(path) }
        raise ViteRuby::MissingExecutableError, "Run pnpm install --frozen-lockfile before building Vite assets."
      end

      super
    end
end

ViteRuby::Runner.prepend(MiruViteExecutable)
