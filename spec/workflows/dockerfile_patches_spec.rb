# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Dockerfile pnpm installs" do
  Rails.root.glob("Dockerfile*").each do |dockerfile|
    it "copies patches before installing packages in #{dockerfile.basename}" do
      commands = dockerfile.readlines.grep(/COPY package\.json|COPY patches|pnpm install/)

      commands.each_with_index do |command, index|
        next unless command.include?("pnpm install")

        expect(commands.first(index).reverse.find { |line| line.include?("COPY") }).to include("COPY patches")
      end
    end
  end
end
