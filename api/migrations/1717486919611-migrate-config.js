'use strict';

module.exports.up = async function (next) {
  const configs = [
    {
      key: 'siteName',
      value: 'My application',
      name: 'Site Name',
      public: true,
      ordering: 0
    },
    {
      key: 'siteLogo',
      value: '/assets/images/logo.png',
      name: 'Site Logo',
      public: true,
      ordering: 1
    },
    {
      key: 'siteBanner',
      value: '',
      name: 'Site Banner',
      public: true,
      ordering: 2
    },
    {
      key: 'siteFavicon',
      value: '/favicon.ico',
      name: 'Site Favicon',
      public: true,
      ordering: 2
    },
    {
      key: 'contactEmail',
      value: 'admin@example.com',
      name: 'Contact Email',
      public: true,
      ordering: 4
    },
    {
      key: 'facebookLink',
      value: 'facebook.com',
      name: 'Facebook Link',
      public: true,
      ordering: 6
    },
    {
      key: 'twitterLink',
      value: 'twitter.com',
      name: 'Twitter Link',
      public: true,
      ordering: 5
    },
    {
      key: 'instagramLink',
      value: 'instagram.com',
      name: 'Instagram Link',
      public: true,
      ordering: 7
    },
    {
      key: 'contactPhone',
      value: '999999999999',
      name: 'Contact Phone',
      public: true,
      ordering: 3
    },
    {
      key: 'homeSEO',
      value: {
        keywords: '',
        description: ''
      },
      name: 'SEO meta data for home page',
      type: 'mixed',
      public: true,
      ordering: 10
    },
    {
      key: 'codeHead',
      value: '',
      name: 'Custom code before end head tag',
      public: true,
      ordering: 8
    },
    {
      key: 'codeBody',
      value: '',
      name: 'Custom code before end body tag',
      public: true,
      ordering: 9
    },
    {
      key: 'commissionRate',
      type: 'number',
      value: 0.2,
      // name: 'Comission meeting setting',
      name: 'Commission Rate Setting',
      description: 'Enter decimal number, from 0 - 1. Value 0.2 means admin will get 20% on the booking',
      public: false,
      ordering: 11
    },
    {
      key: 'commissionCourse',
      type: 'number',
      value: 0.2,
      name: 'Comission course setting',
      description: 'Enter decimal number, from 0 - 1. Value 0.2 means admin will get 20% on the booking',
      public: false,
      ordering: 11
    },
    {
      key: 'currency',
      value: 'USD',
      name: 'Currency',
      public: true,
      ordering: 12
    },
    {
      key: 'currencySymbol',
      value: '$',
      name: 'Currency Symbol',
      public: true,
      ordering: 13
    },
    {
      key: 'smtpTransporter',
      value: {
        type: 'service', // custom
        service: {
          name: '',
          auth: {
            user: '',
            pass: ''
          }
        }, //
        custom: {
          host: '',
          port: 465,
          secure: true,
          auth: {
            user: '',
            pass: ''
          }
        }
      },
      name: 'SMTP Transport',
      description: 'Set up SMTP here',
      public: false,
      type: 'mixed',
      ordering: 14
    },
    {
      key: 'sengridKey',
      value: process.env.SENDGRID_API_KEY || '',
      name: 'Sengrid key',
      public: false,
      ordering: 15
    },
    {
      key: 'stripeKey',
      value: process.env.STRIPE_SECRET_KEY || '',
      name: 'Stripe key',
      public: false,
      ordering: 16
    },
    {
      key: 'youtubeHowItWork',
      value:
        '<iframe width="100%" height="525" src="https://www.youtube.com/embed/ZU0gjnRU-Z4" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
      name: 'Iframe Youtube Video How It Work page (Change width: 100% and height: 525)',
      description:
        'Example: <iframe width="100%" height="525" src="https://www.youtube.com/embed/ZU0gjnRU-Z4" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
      public: true,
      ordering: 18
    },
    {
      key: 'maxFreeSlotToBook',
      value: 5,
      name: 'Maximum number of free trial classes one student can take',
      description: '',
      public: true,
      ordering: 19
    },
    {
      key: 'signupImage',
      value: '',
      name: 'Sign up image',
      description: 'Upload image show on sign up page',
      public: true,
      ordering: 3
    },
    {
      key: 'teachwithusStudents',
      value: '150',
      name: 'Teach with us page - Number of students world wide',
      description: '',
      public: true,
      ordering: 20
    },
    {
      key: 'teachwithusLanguages',
      value: '150',
      name: 'Teach with us page - Number of different languages',
      description: '',
      public: true,
      ordering: 20
    },
    {
      key: 'teachwithusCourses',
      value: '150',
      name: 'Teach with us page - Number of course enrollments',
      description: '',
      public: true,
      ordering: 20
    },
    {
      key: 'teachwithusCountries',
      value: '150',
      name: 'Teach with us page - Number of countries taught',
      description: '',
      public: true,
      ordering: 20
    },
    {
      key: 'teachwithusCustomers',
      value: '150',
      name: 'Teach with us page - Number of enterprise customers',
      description: '',
      public: true,
      ordering: 20
    },
    {
      key: 'platformOnline',
      value: {
        platform: process.env.PLATFORM_ONLINE || 'zoomus', // zoomus | lessonspace
        zoomus: {
          sdk: {
            clientId: '',
            clientSecret: ''
          },
          oauthServerToServer: {
            accountId: '',
            clientId: '',
            clientSecret: '',
            secretToken: ''
          }
        },
        lessonspace: {
          hookUrl: '',
          apiKey: '',
          organisationId: ''
        }
      },
      name: 'Platform to learn online',
      description: 'Platform to learn online',
      public: false,
      type: 'mixed',
      ordering: 17
    },
    {
      key: 'helloBar',
      value: {
        isActive: true,
        text: "We're hiring! Join us",
        link: 'https://google.com',
        textLink: 'Click here'
      },
      name: 'Hello bar config',
      description: '',
      public: true,
      type: 'mixed',
      ordering: 20
    },
    {
      key: 'script',
      value: {
        head: [
          {
            name: 'Demo',
            script: "alert('Demo script work!');",
            isActive: false
          }
        ],
        body: [
          {
            name: 'Demo',
            script: "alert('Demo script work!');",
            isActive: false
          }
        ],
        footer: [
          {
            name: 'Demo',
            script: "alert('Demo script work!');",
            isActive: false
          }
        ]
      },
      name: 'Header and body scripts',
      description: '',
      public: true,
      type: 'mixed',
      ordering: 22
    },
    {
      key: 'homepagePicture',
      value: {
        howItWork: '',
        tutorWithUs: ''
      },
      name: 'Change the homepage picture',
      description: '',
      public: true,
      type: 'mixed',
      ordering: 23
    },
    {
      key: 'howItWorkPicture',
      value: {
        step1: '',
        step2: '',
        step3: '',
        step4: '',
        lifetimeAccess: '',
        recordLiveSession: ''
      },
      name: 'Change the how it work page picture',
      description: '',
      public: true,
      type: 'mixed',
      ordering: 23
    },
    {
      key: 'colorScheme',
      value: {
        btn_color: '#e1245a',
        background_color: '#fff3f7'
      },
      name: 'Color scheme config',
      description: '',
      public: true,
      type: 'mixed',
      ordering: 20,
      group: 'theme'
    },
    {
      key: 'teachWithUsPicture',
      value: {
        banner: '',
        banner_sm: ''
      },
      name: 'Change teach us page pictures',
      description: '',
      public: true,
      type: 'mixed',
      ordering: 1,
      group: 'image'
    },
    {
      key: 'homepagePicture',
      value: {
        background_how_it_work_block: '',
        background_teach_with_us_block: ''
      }
    },
    {
      key: 'profileBanner',
      value: '',
      name: 'Change profile banner',
      description: '',
      public: true,
      type: 'text',
      ordering: 1,
      group: 'image'
    }
  ];

  for (const c of configs) {
    let config = await DB.Config.findOne({
      key: c.key
    });

    if (!config) {
      config = new DB.Config(c);
    } else {
      config.value = {
        ...config.value,
        ...c.value
      };
    }

    await config.save();
  }
  console.log('Mirgate configs success');
  next();
};

module.exports.down = function (next) {
  next();
};
