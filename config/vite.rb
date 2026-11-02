# frozen_string_literal: true

module MiruViteExecutable
  private

    # A PATH fallback can resolve the Ruby vite shim and recursively spawn itself.
    def vite_executable(*)
      configured = config.vite_bin_path
      if configured && File.exist?(configured) && !File.executable?(configured)
        raise ViteRuby::MissingExecutableError, "Check viteBinPath: the configured Vite file is not executable."
      end
      unless File.executable?(configured.to_s) || File.executable?(File.expand_path("node_modules/.bin/vite"))
        raise ViteRuby::MissingExecutableError, "Run pnpm install --frozen-lockfile before building Vite assets."
      end

      super
    end
end

ViteRuby::Runner.prepend(MiruViteExecutable)
