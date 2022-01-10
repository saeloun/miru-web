# frozen_string_literal: true

# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: "Star Wars" }, { name: "Lord of the Rings" }])
#   Character.create(name: "Luke", movie: movies.first)

# Create Owner user
User.create(first_name: "Vipul", last_name: "A M", email: "vipul@example.com", password: "password", password_confirmation: "password", confirmed_at: DateTime.now)

# Create Admin user
User.create(first_name: "Supriya", last_name: "Agarwal", email: "supriya@example.com", password: "password", password_confirmation: "password", confirmed_at: DateTime.now)

# Create Employee User
User.create(first_name: "Akhil", last_name: "G Krishnan", email: "akhil@example.com", password: "password", password_confirmation: "password", confirmed_at: DateTime.now)
