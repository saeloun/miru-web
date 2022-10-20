# frozen_string_literal: true

project_flipkart_com = { name: "Flipkart.com", description: "e-commerce site", billable: true }
project_myntra_com = { name: "Myntra.com", description: "e-commerce fashion site", billable: true }
project_phonepe_com = { name: "PhonePe.com", description: "Payment App", billable: true }
project_cleartrip_com = { name: "Cleartrip.com", description: "Travel App", billable: true }

@project_flipkart_com = @flipkart_client.projects.create!(project_flipkart_com)
@project_myntra_com = @flipkart_client.projects.create!(project_myntra_com)
@project_phonepe_com = @flipkart_client.projects.create!(project_phonepe_com)
@project_cleartrip_com = @flipkart_client.projects.create!(project_cleartrip_com)

project_office_com = { name: "Office.com", description: "Office 365", billable: true }
project_skype_com = { name: "Skype.com", description: "Communication App", billable: true }
project_azure_com = { name: "Azure.com", description: "Cloud Computing", billable: true }

@project_office_com = @microsoft_client.projects.create!(project_office_com)
@project_skype_com = @microsoft_client.projects.create!(project_skype_com)
@project_azure_com = @microsoft_client.projects.create!(project_azure_com)

project_alpha = { name: "Alpha", description: "Alpha description", billable: true }
project_beta = { name: "Beta", description: "Beta description", billable: false }
project_charle = { name: "Charle", description: "Charle description", billable: true }
project_delta = { name: "Delta", description: "Delta description", billable: false }

@client_one_us_project_alpha = @client_one_us.projects.create(project_alpha)
@client_one_us_project_beta = @client_one_us.projects.create(project_beta)
@client_two_us_project_charle = @client_two_us.projects.create(project_charle)
@client_two_us_project_delta = @client_two_us.projects.create(project_delta)

# Reindex Searchkick indexes
Project.reindex

puts "Projects Created"
# Projects End
