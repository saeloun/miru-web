# frozen_string_literal: true

# User Roles Start
SAELOUN_INDIA, SAELOUN_US = ["Saeloun India Pvt. Ltd", "Saeloun USA INC."].map { |company| Company.find_by(name: company) }
VIPUL, SUPRIYA, AKHIL, KESHAV, ROHIT = ["vipul@example.com", "supriya@example.com", "akhil@example.com", "keshav@example.com", "rohit@example.com"].map { |user| User.find_by(email: user) }

vipul.add_role(:owner, SAELOUN_INDIA)    # Vipul is Owner in Company India
vipul.add_role(:owner, SAELOUN_US)       # Vipul is Owner in Company US
supriya.add_role(:admin, SAELOUN_INDIA)  # Supriya is Admin in Company India
supriya.add_role(:admin, SAELOUN_US)     # Supriya is Admin in Company US
akhil.add_role(:employee, SAELOUN_INDIA) # Akhil is Employee is Company India
akhil.add_role(:employee, SAELOUN_US)    # Akhil is Employee is Company US
keshav.add_role(:admin, SAELOUN_INDIA)   # Keshav is Admin is Company India
keshav.add_role(:employee, SAELOUN_US)   # Keshav is Employee is Company US
rohit.add_role(:employee, SAELOUN_INDIA) # Rohit is Employee is Company India
rohit.add_role(:admin, SAELOUN_US)       # Rohit is Admin is Company US
puts "Users Roles Created"
# User Roles End
