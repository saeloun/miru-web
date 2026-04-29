# frozen_string_literal: true

module MCP
  module Miru
    class Client
      def self.http(url:, headers: {}, &block)
        transport = MCP::Client::HTTP.new(url: url, headers: headers, &block)
        new(transport: transport)
      end

      def self.stdio(command:, args: [], env: nil, read_timeout: nil)
        transport = MCP::Client::Stdio.new(
          command: command,
          args: args,
          env: env,
          read_timeout: read_timeout
        )
        new(transport: transport)
      end

      def initialize(transport:)
        @transport = transport
        @client = MCP::Client.new(transport: transport)
      end

      delegate :tools, to: :@client

      def call_tool(name:, arguments: {})
        tool = tools.find { |entry| entry.name == name.to_s }
        raise ArgumentError, "Unknown MCP tool: #{name}" if tool.nil?

        @client.call_tool(tool: tool, arguments: arguments)
      end

      def close
        @transport.close if @transport.respond_to?(:close)
      end
    end
  end
end
