# frozen_string_literal: true

# User Roles Start
SAELOUN_INDIA, SAELOUN_US = ["Saeloun India Pvt. Ltd", "Saeloun USA INC."].map { |company| Company.find_by(name: company) }
VIPUL, SUPRIYA, AKHIL, KESHAV, ROHIT = ["vipul@example.com", "supriya@example.com", "akhil@example.com", "keshav@example.com", "rohit@example.com"].map { |user| User.find_by(email: user) }

VIPUL.add_role(:owner, SAELOUN_INDIA)    # Vipul is Owner in Company India
VIPUL.add_role(:owner, SAELOUN_US)       # Vipul is Owner in Company US
SUPRIYA.add_role(:admin, SAELOUN_INDIA)  # Supriya is Admin in Company India
SUPRIYA.add_role(:admin, SAELOUN_US)     # Supriya is Admin in Company US
AKHIL.add_role(:employee, SAELOUN_INDIA) # Akhil is Employee is Company India
AKHIL.add_role(:employee, SAELOUN_US)    # Akhil is Employee is Company US
KESHAV.add_role(:admin, SAELOUN_INDIA)   # Keshav is Admin is Company India
KESHAV.add_role(:employee, SAELOUN_US)   # Keshav is Employee is Company US
ROHIT.add_role(:employee, SAELOUN_INDIA) # Rohit is Employee is Company India
ROHIT.add_role(:admin, SAELOUN_US)       # Rohit is Admin is Company US
puts "Users Roles Created"
# User Roles End
