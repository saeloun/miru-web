# frozen_string_literal: true

# This configuration file will be evaluated by Puma. The top-level methods that
# are invoked here are part of Puma's configuration DSL. For more information
# about methods provided by the DSL, see https://puma.io/puma/Puma/DSL.html.
#
# Puma starts a configurable number of processes (workers) and each process
# serves each request in a thread from an internal thread pool.
#
# You can control the number of workers using ENV["WEB_CONCURRENCY"]. You
# should only set this value when you want to run 2 or more workers. The
# default is already 1.
#
# The ideal number of threads per worker depends both on how much time the
# application spends waiting for IO operations and on how much you wish to
# prioritize throughput over latency.
#
# As a rule of thumb, increasing the number of threads will increase how much
# traffic a given process can handle (throughput), but due to CRuby's
# Global VM Lock (GVL) it has diminishing returns and will degrade the
# response time (latency) of the application.
#
# The default is set to 3 threads as it's deemed a decent compromise between
# throughput and latency for the average Rails application.
#
# Any libraries that use a connection pool or another resource pool should
# be configured to provide at least as many connections as the number of
# threads. This includes Active Record's `pool` parameter in `database.yml`.
threads_count = ENV.fetch("RAILS_MAX_THREADS", 3)
threads threads_count, threads_count

# Specifies the `environment` that Puma will run in.
environment ENV.fetch("RAILS_ENV", "development")

# Specifies the `port` that Puma will listen on to receive requests; default is 3000.
port ENV.fetch("PORT", 3000)

# Specifies the `worker_timeout` threshold that Puma will use to wait before
# terminating a worker in development environments.
worker_timeout 3600 if ENV.fetch("RAILS_ENV", "development") == "development"

# Allow puma to be restarted by `bin/rails restart` command.
plugin :tmp_restart

# Run the Solid Queue supervisor inside of Puma for single-server deployments
plugin :solid_queue if ENV["SOLID_QUEUE_IN_PUMA"]

# Specify the PID file. Defaults to tmp/pids/server.pid in development.
# In other environments, only set the PID file if requested.
pidfile ENV["PIDFILE"] if ENV["PIDFILE"]

# Use the `preload_app!` method when specifying a `workers` number.
# This directive tells Puma to first boot the application and load code
# before forking the application. This takes advantage of Copy On Write
# process behavior so workers use less memory.
if ENV["WEB_CONCURRENCY"] && ENV["WEB_CONCURRENCY"].to_i > 1
  workers ENV.fetch("WEB_CONCURRENCY", 2)
  preload_app!

  # Enable hot restart capability for better zero-downtime deploys
  fork_worker if ENV["PUMA_FORK_WORKER"]

  before_fork do
    # Disconnect from database connection pool before forking
    ActiveRecord::Base.connection_pool.disconnect! if defined?(ActiveRecord)
  end

  on_worker_boot do
    # Reconnect to database after fork
    ActiveRecord::Base.establish_connection if defined?(ActiveRecord)
  end
end

# Enable request queue time tracking for better monitoring
wait_for_less_busy_worker 0.001 if ENV["PUMA_WAIT_FOR_LESS_BUSY_WORKER"]

# Enable low latency mode for better response times
low_latency if ENV["PUMA_LOW_LATENCY"]

# Set up stdout and stderr redirect for logging
if ENV["RAILS_LOG_TO_STDOUT"]
  stdout_redirect(
    ENV.fetch("PUMA_STDOUT_LOG", "log/puma.stdout.log"),
    ENV.fetch("PUMA_STDERR_LOG", "log/puma.stderr.log"),
    true
  )
end

# Verify SSL settings
if ENV["SSL_CERT_FILE"] && ENV["SSL_KEY_FILE"]
  ssl_bind(
    "0.0.0.0",
    ENV.fetch("SSL_PORT", 3001),
    cert: ENV["SSL_CERT_FILE"],
    key: ENV["SSL_KEY_FILE"],
    verify_mode: ENV.fetch("SSL_VERIFY_MODE", "none")
  )
end
