# frozen_string_literal: true

# User Roles Start
company_India, company_US = Company.first(2)
vipul, supriya, akhil, keshav, rohit = User.first(5)

vipul.add_role(:owner, company_India)    # Vipul is Owner in Company India
vipul.add_role(:owner, company_US)       # Vipul is Owner in Company US
supriya.add_role(:admin, company_India)  # Supriya is Admin in Company India
supriya.add_role(:admin, company_US)     # Supriya is Admin in Company US
akhil.add_role(:employee, company_India) # Akhil is Employee is Company India
akhil.add_role(:employee, company_US)    # Akhil is Employee is Company US
keshav.add_role(:admin, company_India)   # Keshav is Admin is Company India
keshav.add_role(:employee, company_US)   # Keshav is Employee is Company US
rohit.add_role(:employee, company_India) # Rohit is Employee is Company India
rohit.add_role(:admin, company_US)       # Rohit is Admin is Company US
puts "Users Roles Created"
# User Roles End
