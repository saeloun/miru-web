# frozen_string_literal: true

# User Roles Start
saeloun_India, saeloun_US = ["Saeloun India Pvt. Ltd", "Saeloun USA INC."].map { |company| Company.find_by(name: company) }
vipul, supriya, akhil, keshav, rohit = ["vipul@example.com", "supriya@example.com", "akhil@example.com", "keshav@example.com", "rohit@example.com"].map { |user| User.find_by(email: user) }

vipul.add_role(:owner, saeloun_India)    # Vipul is Owner in Company India
vipul.add_role(:owner, saeloun_US)       # Vipul is Owner in Company US
supriya.add_role(:admin, saeloun_India)  # Supriya is Admin in Company India
supriya.add_role(:admin, saeloun_US)     # Supriya is Admin in Company US
akhil.add_role(:employee, saeloun_India) # Akhil is Employee is Company India
akhil.add_role(:employee, saeloun_US)    # Akhil is Employee is Company US
keshav.add_role(:admin, saeloun_India)   # Keshav is Admin is Company India
keshav.add_role(:employee, saeloun_US)   # Keshav is Employee is Company US
rohit.add_role(:employee, saeloun_India) # Rohit is Employee is Company India
rohit.add_role(:admin, saeloun_US)       # Rohit is Admin is Company US
puts "Users Roles Created"
# User Roles End
