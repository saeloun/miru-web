# frozen_string_literal: true

# User Roles Start

@vipul.add_role(:owner, @saeloun_india)    # Vipul is Owner in Company India
@vipul.add_role(:owner, @saeloun_us)       # Vipul is Owner in Company US
@supriya.add_role(:admin, @saeloun_india)  # Supriya is Admin in Company India
@supriya.add_role(:admin, @saeloun_us)     # Supriya is Admin in Company US
@akhil.add_role(:employee, @saeloun_india) # Akhil is Employee is Company India
@akhil.add_role(:employee, @saeloun_us)    # Akhil is Employee is Company US
@keshav.add_role(:admin, @saeloun_india)   # Keshav is Admin is Company India
@keshav.add_role(:employee, @saeloun_us)   # Keshav is Employee is Company US
@rohit.add_role(:employee, @saeloun_india) # Rohit is Employee is Company India
@rohit.add_role(:admin, @saeloun_us)       # Rohit is Admin is Company US
puts "Users Roles Created"
# User Roles End
