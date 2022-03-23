# frozen_string_literal: true

# User Roles Start

@vipul.add_role(:owner, @saeloun_india)    # Vipul is Owner in Saeloun India
@vipul.add_role(:owner, @saeloun_us)       # Vipul is Owner in Saeloun US
@supriya.add_role(:admin, @saeloun_india)  # Supriya is Admin in Saeloun India
@supriya.add_role(:admin, @saeloun_us)     # Supriya is Admin in Saeloun US
@akhil.add_role(:employee, @saeloun_india) # Akhil is Employee is Saeloun India
@akhil.add_role(:employee, @saeloun_us)    # Akhil is Employee is Saeloun US
@keshav.add_role(:admin, @saeloun_india)   # Keshav is Admin is Saeloun India
@keshav.add_role(:employee, @saeloun_us)   # Keshav is Employee is Saeloun US
@rohit.add_role(:employee, @saeloun_india) # Rohit is Employee is Saeloun India
@rohit.add_role(:admin, @saeloun_us)       # Rohit is Admin is Saeloun US
puts "Users Roles Created"
# User Roles End
