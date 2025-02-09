export const tutorMenus = [
  {
    icon: 'fi fi-rr-user',
    title: 'Profile settings',
    description: 'The profile settings of the tutor can be edited and updated here.',
    path: '/users/profile',
    key: 'menu-my-profile-1'
  },

  {
    icon: 'fi fi-rs-chalkboard-user',
    title: 'Group Class',
    description: 'The webinars of the group classes posted by the tutor will be displayed here.',
    path: '/users/groupclass',
    key: 'menu-webinar-list'
  },
  {
    icon: 'fi fi-rs-chalkboard-user',
    title: 'Create a group class',
    description: 'The tutor can create a new group class from here.',
    path: '/users/groupclass/create',
    key: 'menu-webinar-create'
  },
  {
    icon: 'fi fi-rr-book-alt',
    title: 'Courses List',
    description: 'The courses created by the tutor will be listed here.',
    path: '/users/courses',
    key: 'menu-course-list'
  },
  {
    icon: 'fi fi-rr-book-alt',
    title: 'Create a course',
    description: 'The tutor can create a new course.',
    path: '/users/courses/create',
    key: 'menu-course-create'
  },

  {
    icon: 'fi fi-rs-coins',
    title: 'Payout request',
    description: 'Shows the earning and payout status of the tutor.',
    path: '/users/payout/request',
    key: 'menu-my-payout-1'
  },
  {
    icon: 'fi fi-rr-calendar-clock',
    title: 'Set your calendar',
    description: 'Allows the tutor to book appointments for his one-one class.',
    path: '/users/1on1classes',
    key: 'menu-my-schedule'
  },
  {
    icon: 'fi fi-rr-calendar',
    title: 'Upcoming appointments',
    description: 'The appointments made by this tutor for the one -one class.',
    path: '/users/appointments',
    key: 'menu-my-appointment'
  },
  {
    icon: 'fi fi-rr-calendar-check',
    title: 'Group class bookings',
    description: 'The appointments made by this tutor for the group classes.',
    path: '/users/appointments',
    key: 'menu-my-appointment-1'
  },
  {
    icon: 'fi fi-rr-chart-histogram',
    title: 'Earnings dashboard',
    description: 'The earnings made by this tutor.',
    path: '/users/payout/request',
    key: 'menu-my-payout-2'
  },
  {
    icon: 'fi fi-rr-credit-card',
    title: 'Add a bank info',
    description: 'The tutor add a PayPal and Bank account for payouts.',
    path: '/users/payout/account/create',
    key: 'menu-my-payout'
  },
  {
    icon: 'fi fi-rr-user-add',
    title: 'Invite a Friend',
    description: 'The tutors can invite their friends to the platform.',
    path: '/users/profile',
    key: 'menu-my-profile'
  }

];

export const studentMenus = [
  {
    icon: 'fi fi-rr-user',
    title: 'Profile settings',
    description: 'The profile settings of the tutor can be edited and updated here.',
    path: '/users/profile',
    key: 'menu-my-profile-1'
  },
  {
    icon: 'fi fi-rs-chalkboard-user',
    title: 'Browse Group class categories',
    description: 'The students can filter by categories and browse the group classes.',
    path: '/groupclass',
    key: 'menu-categories'
  },
  {
    icon: 'fi fi-rr-book-alt',
    title: 'My purchased courses',
    description: 'The courses purchased by the students will be listed here.',
    path: '/users/my-courses',
    key: 'menu-my-course'
  },
  {
    icon: 'fi fi-rr-calendar',
    title: 'Upcoming appointments',
    description: 'The appointments made by the students for the 1-1 classes.',
    path: '/users/lessons',
    key: 'menu-my-lesson'
  },
  {
    icon: 'fi fi-rr-credit-card',
    title: 'My Transactions ',
    description: 'Students sees all his purchases /transactions for 1-1, webinar and courses here.',
    path: '/users/transaction',
    key: 'menu-my-transaction'
  },
  {
    icon: 'fi fi-rr-comment-dollar',
    title: 'Refund Request',
    description: 'The refund request for the student will be displayed.',
    path: '/users/refund/request',
    key: 'menu-my-refund'
  }
];
