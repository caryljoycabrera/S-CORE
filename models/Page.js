// ===== Page Model =====
// This model stores editable page content for the website
// Used for managing dynamic content like the homepage

const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    // Hero Section
    heroTitle: {
      type: String,
      default: 'Empowering Communication,'
    },
    heroTitleHighlight: {
      type: String,
      default: 'Building Connections'
    },
    heroSubtitle: {
      type: String,
      default: 'The Strategic Communications Office identifies the information needs of the different offices of the academic community and develops appropriate communication strategies to meet those needs.'
    },

    // S-CORE Section
    sCoreSectionTitle: {
      type: String,
      default: 'S-CORE Platform Introduction'
    },
    sCorePlatformDescription: {
      type: String,
      default: 'SCO Creative Optimization for Requests and Engagement System'
    },
    sCoreWhatIsTitle: {
      type: String,
      default: 'What is S-CORE?'
    },
    sCoreWhatIsDescription: {
      type: String,
      default: 'S-CORE is the official platform for managing communications, service requests, and engagement activities at DLSU-D. It streamlines the process for students, staff, and units to submit requests, track progress, and collaborate efficiently with the Strategic Communications Office.'
    },
    sCoreWhyTitle: {
      type: String,
      default: 'Why use S-CORE?'
    },
    sCoreWhyDescription: {
      type: String,
      default: 'S-CORE features a user-friendly dashboard, real-time notifications, secure request tracking, and collaborative tools. It empowers users to efficiently submit requests, monitor progress, communicate with the SCO, and more, all in one integrated platform.'
    },
    sCoreDashboardImage: {
      type: String,
      default: '/Picture/dashboard_ss.png'
    },
    sCoreLoginButtonText: {
      type: String,
      default: 'Login'
    },
    sCoreLoginButtonLink: {
      type: String,
      default: '/login'
    },
    sCoreSignupButtonText: {
      type: String,
      default: 'Sign Up'
    },
    sCoreSignupButtonLink: {
      type: String,
      default: '/register'
    },
    
    // SCO Pledge
    pledgeSectionTitle: {
      type: String,
      default: 'Our SCO Pledge'
    },
    pledgeItems: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }],
    
    // About Section
    aboutSectionTitle: {
      type: String,
      default: 'About Our Office'
    },
    aboutSectionSubtitle: {
      type: String,
      default: 'Dedicated to excellence in institutional communication and community engagement'
    },
    aboutMissionTitle: {
      type: String,
      default: 'Our Mission'
    },
    aboutMission: {
      type: String,
      default: 'The Strategic Communications Office serves as the primary hub for institutional communication at De La Salle University-Dasmariñas. We identify the diverse information needs of different offices within our academic community and develop comprehensive communication strategies to meet those needs effectively.'
    },
    aboutVisionTitle: {
      type: String,
      default: 'Our Vision'
    },
    aboutVision: {
      type: String,
      default: 'Through innovative approaches and creative solutions, we produce high-quality institutional information materials, establish meaningful linkages with mass media, and formulate strategic marketing initiatives that accurately represent our University\'s values and achievements.'
    },
    aboutFeatures: [{
      icon: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }],
    
    // Gallery Section
    gallerySectionTitle: {
      type: String,
      default: 'Gallery'
    },
    gallerySectionSubtitle: {
      type: String,
      default: 'See our latest events and highlights'
    },
    galleryEmbedUrl: {
      type: String,
      default: 'https://www.dlsud.edu.ph/sco/gallery/'
    },
    
    // Contact Information
    contactSectionTitle: {
      type: String,
      default: 'Contact Us'
    },
    contactIntroText: {
      type: String,
      default: 'Let us know if you have concerns.'
    },
    contactCards: [{
      icon: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      contactInfo: {
        type: String,
        required: true
      }
    }],
    contactEmail: {
      type: String,
      default: 'sco@dlsud.edu.ph'
    },
    contactPhone: {
      type: String,
      default: '(046) 481-1900 local 3031'
    },
    contactAddress: {
      type: String,
      default: '2nd Floor, Ayuntamiento De Gonzalez Building\nDLSU-Dasmariñas, Cavite'
    },
    contactHours: {
      type: String,
      default: 'Monday - Friday: 8:00 AM - 5:00 PM'
    },
    
    // Social Media Links
    socialSectionTitle: {
      type: String,
      default: 'Follow Us on Social Media'
    },
    socialMedia: [{
      icon: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      }
    }],
    
    // Hero Buttons
    heroPrimaryButtonText: {
      type: String,
      default: 'Connect With Us'
    },
    heroPrimaryButtonLink: {
      type: String,
      default: '#contact'
    },
    heroSecondaryButtonText: {
      type: String,
      default: 'Learn More'
    },
    heroSecondaryButtonLink: {
      type: String,
      default: '#about'
    },
    
    // Services Section
    servicesSectionTitle: {
      type: String,
      default: 'Our Services'
    },
    servicesSectionSubtitle: {
      type: String,
      default: 'Comprehensive communication solutions tailored to the needs of the institution'
    },
    services: [{
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }],
    
    // Team Members Section
    teamSectionTitle: {
      type: String,
      default: 'Meet Our Team'
    },
    teamSectionSubtitle: {
      type: String,
      default: 'Dedicated professionals committed to excellence in communication'
    },
    teamMembers: [{
      name: {
        type: String,
        required: true
      },
      role: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      }
    }],
    
    // Footer
    footerTagline: {
      type: String,
      default: 'Committed to Excellence in Communication | Building Stronger Communities'
    },
    footerText: {
      type: String,
      default: 'Strategic Communications Office, De La Salle University-Dasmariñas'
    },
    footerLinks: [{
      text: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }],
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Update lastUpdated timestamp before saving
pageSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Page', pageSchema);
