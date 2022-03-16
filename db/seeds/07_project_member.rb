# frozen_string_literal: true

# Projects Members Start
SAELOUN_INDIA, SAELOUN_US = ["Saeloun India Pvt. Ltd", "Saeloun USA INC."].map { |company| Company.find_by(name: company) }
VIPUL, SUPRIYA, AKHIL, KESHAV, ROHIT = ["vipul@example.com", "supriya@example.com", "akhil@example.com", "keshav@example.com", "rohit@example.com"].map { |user| User.find_by(email: user) }

# Clients
common_client_saeloun_India = Client.find_by_company_id_and_name(SAELOUN_INDIA.id, "common client")
client_one_saeloun_India = Client.find_by_company_id_and_name(SAELOUN_INDIA, "client_one saeloun_India")
common_client_saeloun_US = Client.find_by_company_id_and_name(SAELOUN_US, "common client")
client_one_saeloun_US = Client.find_by_company_id_and_name(SAELOUN_US, "client_one saeloun_US")

# Projects
project_1_common_client_saeloun_India = Project.find_by_client_id_and_name(common_client_saeloun_India.id, "Project_1_common_client_saeloun_India")
project_1_Client_1_saeloun_India = Project.find_by_client_id_and_name(client_one_saeloun_India.id, "Project_1_Client_1_saeloun_India")
project_1_common_client_saeloun_US = Project.find_by_client_id_and_name(common_client_saeloun_US.id, "Project_1_common_client_saeloun_US")
project_1_Client_1_saeloun_US = Project.find_by_client_id_and_name(client_one_saeloun_US.id, "Project_1_Client_1_saeloun_US")

# vipul, supriya, akhil, keshav are working on project_1_Common_client_one, project_1_Common_client_two which belong to common client of Company_India and Company_US respectively
[VIPUL, SUPRIYA, AKHIL, KESHAV].each do |user|
  [project_1_common_client_saeloun_India, project_1_common_client_saeloun_US].each do |project|
    user.project_members.create!(project_id: project.id, hourly_rate: 5000)
  end
end

# supriya, akhil, keshav, rohit are working on project_1_client_1_company_India, project_1_client_1_company_US which belong to common client of Company_India and Company_US respectively
[SUPRIYA, AKHIL, KESHAV, ROHIT].each do |user|
  [project_1_Client_1_saeloun_India, project_1_Client_1_saeloun_US].each do |project|
    user.project_members.create!(project_id: project.id, hourly_rate: 5000)
  end
end

puts "Projects Members Created"
# Projects Members end
