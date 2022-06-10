# frozen_string_literal: true

# User Roles Start

@u1.add_role(:owner, @c1)
@u3.add_role(:admin, @c1)
@u5.add_role(:employee, @c1)

@u2.add_role(:owner, @c2)
@u4.add_role(:admin, @c2)
@u5.add_role(:employee, @c2)

puts "Users Roles Created"
# User Roles End
