// configuration.js
// Handles preview, save, and reset modals for configuration page

document.addEventListener('DOMContentLoaded', function () {
        // Profile/Logout dropdown logic
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownMenu = document.getElementById('dropdownMenu');
        if (dropdownToggle && dropdownMenu) {
          dropdownToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
          });
          document.addEventListener('click', function (e) {
            if (!dropdownToggle.contains(e.target)) {
              dropdownMenu.classList.remove('show');
            }
          });
        }
      // System tab modal logic
      const systemSaveBtn = document.getElementById('systemSaveBtn');
      const systemResetBtn = document.getElementById('systemResetBtn');

      if (systemSaveBtn) {
        systemSaveBtn.addEventListener('click', function (e) {
          e.preventDefault();
          const modal = document.getElementById('systemSaveConfirmModal');
          modal.classList.add('active');
        });
      }
      if (systemResetBtn) {
        systemResetBtn.addEventListener('click', function () {
          const modal = document.getElementById('systemResetConfirmModal');
          modal.classList.add('active');
        });
      }

      // About S-CORE tab modal logic
      const aboutScorePreviewBtn = document.getElementById('aboutScorePreviewBtn');
      const aboutScoreSaveBtn = document.getElementById('aboutScoreSaveBtn');
      const aboutScoreResetBtn = document.getElementById('aboutScoreResetBtn');

      if (aboutScorePreviewBtn) {
        aboutScorePreviewBtn.addEventListener('click', function (e) {
          e.preventDefault();
          showAboutScorePreview();
        });
      }
      if (aboutScoreSaveBtn) {
        aboutScoreSaveBtn.addEventListener('click', function (e) {
          e.preventDefault();
          const modal = document.getElementById('aboutScoreSaveConfirmModal');
          modal.classList.add('active');
        });
      }
      if (aboutScoreResetBtn) {
        aboutScoreResetBtn.addEventListener('click', function () {
          const modal = document.getElementById('aboutScoreResetConfirmModal');
          modal.classList.add('active');
        });
      }
    // Modal logic
    const previewBtn = document.getElementById('previewBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const modal = document.getElementById('configModal');
    const modalContent = document.getElementById('modalContent');
    const toast = document.getElementById('configToast');

    // Check for success/error messages in URL
    const urlParams = new URLSearchParams(window.location.search);
    const successMsg = urlParams.get('success');
    const errorMsg = urlParams.get('error');
    
    if (successMsg) {
        showToast(successMsg);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorMsg) {
        showToast(errorMsg, true);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Helper to get dynamic items
    function getDynamicItems(containerId, namePrefix, fields) {
        const container = document.getElementById(containerId);
        if (!container) return [];
        const items = [];
        const itemElements = container.querySelectorAll('.dynamic-item');
        itemElements.forEach((item, index) => {
            const itemData = {};
            fields.forEach(field => {
                const input = item.querySelector(`[name="${namePrefix}${field}[]"]`);
                if (input) {
                    itemData[field.toLowerCase()] = input.value;
                }
            });
            if (Object.keys(itemData).length > 0) {
                items.push(itemData);
            }
        });
        return items;
    }

    // Preview functionality
    function showPreview() {
        const previewBody = document.getElementById('modalContent');
        const modal = document.getElementById('configModal');

        const content = {
            heroTitle: document.getElementById('heroTitle')?.value || '',
            heroTitleHighlight: document.getElementById('heroTitleHighlight')?.value || '',
            heroSubtitle: document.getElementById('heroSubtitle')?.value || '',
            heroPrimaryButtonText: document.getElementById('heroPrimaryButtonText')?.value || '',
            heroPrimaryButtonLink: document.getElementById('heroPrimaryButtonLink')?.value || '',
            heroSecondaryButtonText: document.getElementById('heroSecondaryButtonText')?.value || '',
            heroSecondaryButtonLink: document.getElementById('heroSecondaryButtonLink')?.value || '',
            pledgeSectionTitle: document.getElementById('pledgeSectionTitle')?.value || '',
            aboutSectionTitle: document.getElementById('aboutSectionTitle')?.value || '',
            aboutSectionSubtitle: document.getElementById('aboutSectionSubtitle')?.value || '',
            aboutMissionTitle: document.getElementById('aboutMissionTitle')?.value || '',
            aboutMission: document.getElementById('aboutMission')?.value || '',
            aboutVisionTitle: document.getElementById('aboutVisionTitle')?.value || '',
            aboutVision: document.getElementById('aboutVision')?.value || '',
            gallerySectionTitle: document.getElementById('gallerySectionTitle')?.value || '',
            gallerySectionSubtitle: document.getElementById('gallerySectionSubtitle')?.value || '',
            galleryEmbedUrl: document.getElementById('galleryEmbedUrl')?.value || '',
            servicesSectionTitle: document.getElementById('servicesSectionTitle')?.value || '',
            servicesSectionSubtitle: document.getElementById('servicesSectionSubtitle')?.value || '',
            teamSectionTitle: document.getElementById('teamSectionTitle')?.value || '',
            teamSectionSubtitle: document.getElementById('teamSectionSubtitle')?.value || '',
            contactSectionTitle: document.getElementById('contactSectionTitle')?.value || '',
            contactIntroText: document.getElementById('contactIntroText')?.value || '',
            socialSectionTitle: document.getElementById('socialSectionTitle')?.value || '',
            footerTagline: document.getElementById('footerTagline')?.value || '',
            footerText: document.getElementById('footerText')?.value || '',
            sCoreWhatIsTitle: document.getElementById('sCoreWhatIsTitle')?.value || '',
            sCoreWhatIsDescription: document.getElementById('sCoreWhatIsDescription')?.value || '',
            sCoreWhyTitle: document.getElementById('sCoreWhyTitle')?.value || '',
            sCoreWhyDescription: document.getElementById('sCoreWhyDescription')?.value || '',
            sCoreDashboardImage: document.getElementById('sCoreDashboardImage')?.value || '',
            sCoreLoginButtonText: document.getElementById('sCoreLoginButtonText')?.value || '',
            sCoreLoginButtonLink: document.getElementById('sCoreLoginButtonLink')?.value || '',
            sCoreSignupButtonText: document.getElementById('sCoreSignupButtonText')?.value || '',
            sCoreSignupButtonLink: document.getElementById('sCoreSignupButtonLink')?.value || ''
        };

        // Get dynamic content
        const pledges = getDynamicItems('pledgeItemsContainer', 'pledge', ['Name', 'Description']);
        const services = getDynamicItems('servicesContainer', 'service', ['Title', 'Description']);
        const teamMembers = getDynamicItems('teamMembersContainer', 'team', ['Name', 'Role', 'Email']);
        const contactCards = getDynamicItems('contactCardsContainer', 'contact', ['Icon', 'Title', 'Description', 'Info']);
        const socialMedia = getDynamicItems('socialMediaContainer', 'social', ['Icon', 'Title', 'Url']);
        const footerLinks = getDynamicItems('footerLinksContainer', 'footerLink', ['Text', 'Url']);
        const aboutFeatures = getDynamicItems('aboutFeaturesContainer', 'feature', ['Icon', 'Title', 'Description']);

        previewBody.innerHTML = `
          <style>
            .preview-homepage { font-family: 'Inter', sans-serif; background: #fafcfa; color: #1a2e1a; line-height: 1.6; max-width: 100%; margin: 0 auto; }
            .preview-hero { min-height: auto; display: flex; align-items: center; padding: 40px 20px; background: linear-gradient(45deg, #f0f8f0, #e8f5e8); position: relative; }
            .preview-hero-container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
            .preview-hero-content h1 { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; margin-bottom: 15px; line-height: 1.2; }
            .preview-hero-highlight { background: linear-gradient(120deg, #4caf50 0%, #ffd700 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .preview-hero-content p { font-size: 1.1rem; color: #4a5d4a; margin-bottom: 25px; }
            .preview-hero-buttons { display: flex; gap: 15px; align-items: center; }
            .preview-btn-primary { background: linear-gradient(135deg, #1a5d1a 0%, #2d7a2d 100%); color: white !important; padding: 12px 25px; border-radius: 25px; text-decoration: none; font-weight: 600; display: inline-block; }
            .preview-btn-secondary { color: #1a5d1a; text-decoration: none; font-weight: 600; display: inline-block; padding: 12px 25px; }
            .preview-hero-card { background: rgba(255,255,255,0.9); border-radius: 20px; padding: 30px; box-shadow: 0 10px 30px rgba(26,93,26,0.1); }
            .preview-pledge-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #1a5d1a; margin-bottom: 20px; text-align: center; }
            .preview-pledge-item { margin-bottom: 15px; }
            .preview-pledge-item h4 { color: #2d7a2d; font-weight: 700; text-transform: uppercase; font-size: 0.9rem; margin-bottom: 5px; }
            .preview-pledge-item p { color: #4a5d4a; font-size: 0.9rem; }
            .preview-section { padding: 40px 20px; }
            .preview-section-container { max-width: 1200px; margin: 0 auto; }
            .preview-section-header { text-align: center; margin-bottom: 40px; }
            .preview-section-title { font-family: 'Playfair Display', serif; font-size: 2.5rem; color: #1a2e1a; margin-bottom: 10px; }
            .preview-section-subtitle { font-size: 1rem; color: #4a5d4a; }
            .preview-about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .preview-about-content h3 { font-size: 1.5rem; color: #1a2e1a; margin-bottom: 15px; }
            .preview-about-content p { font-size: 1rem; color: #4a5d4a; margin-bottom: 15px; }
            .preview-services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .preview-service-card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 5px 20px rgba(26,93,26,0.1); }
            .preview-service-number { background: linear-gradient(135deg, #1a5d1a 0%, #2d7a2d 100%); color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 15px; }
            .preview-service-card h3 { font-size: 1.2rem; color: #1a2e1a; margin-bottom: 10px; }
            .preview-service-card p { color: #4a5d4a; }
            .preview-team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
            .preview-team-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(26,93,26,0.1); border: 2px solid #e8f5e8; }
            .preview-team-info { padding: 30px; }
            .preview-team-info h4 { font-size: 1.1rem; color: #1a2e1a; margin-bottom: 5px; }
            .preview-team-role { color: #4caf50; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; font-size: 0.8rem; }
            .preview-team-contact { font-size: 0.9rem; color: #4a5d4a; }
            .preview-contact-section { background: #0d2818; color: white; padding: 40px 20px; }
            .preview-contact-content { text-align: center; max-width: 800px; margin: 0 auto; }
            .preview-contact-content h2 { font-family: 'Playfair Display', serif; font-size: 2.5rem; margin-bottom: 15px; }
            .preview-contact-intro { font-size: 1.1rem; color: rgba(255,255,255,0.9); margin-bottom: 30px; }
            .preview-contact-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .preview-contact-card { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 30px; text-align: center; border: 1px solid rgba(255,255,255,0.2); }
            .preview-contact-icon { width: 60px; height: 60px; background: #ffd700; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #0d2818; margin-bottom: 15px; }
            .preview-contact-card h3 { font-size: 1.2rem; margin-bottom: 10px; }
            .preview-contact-card p { color: rgba(255,255,255,0.9); margin-bottom: 10px; }
            .preview-social-section { padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); }
            .preview-social-section h3 { font-size: 1.1rem; margin-bottom: 15px; color: rgba(255,255,255,0.9); }
            .preview-social-links { display: flex; justify-content: center; gap: 10px; }
            .preview-social-link { width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.2rem; }
            .preview-footer { background: #1a2e1a; color: rgba(255,255,255,0.8); padding: 30px 20px; text-align: center; }
            .preview-footer-content { max-width: 1200px; margin: 0 auto; }
            .preview-footer-tagline { font-size: 1.2rem; margin-bottom: 15px; }
            .preview-footer-links { display: flex; justify-content: center; gap: 20px; margin: 15px 0; }
            .preview-footer-links a { color: rgba(255,255,255,0.8); text-decoration: none; }
            .preview-footer-copyright p { margin: 0; }
            .preview-gallery { background: #14532d; color: #fff; padding: 60px 20px; }
            .preview-gallery h2 { text-align: center; font-family: 'Playfair Display', serif; font-size: 2.5rem; color: #fff; margin-bottom: 20px; }
            .preview-gallery p { text-align: center; font-size: 1rem; color: #fff; margin-bottom: 30px; }
            .preview-gallery .gallery-embed { display: flex; justify-content: center; align-items: center; min-height: 500px; }
            .preview-gallery iframe { width: 100%; max-width: 900px; height: 500px; border-radius: 16px; border: none; box-shadow: 0 4px 32px rgba(0,0,0,0.2); }
          </style>
          <div class="preview-homepage">
            <!-- Hero Section -->
            <section class="preview-hero">
              <div class="preview-hero-container">
                <div class="preview-hero-content">
                  <h1>${content.heroTitle} <span class="preview-hero-highlight">${content.heroTitleHighlight}</span></h1>
                  <p>${content.heroSubtitle}</p>
                  <div class="preview-hero-buttons">
                    <a href="${content.heroPrimaryButtonLink}" class="preview-btn-primary">${content.heroPrimaryButtonText} →</a>
                    <a href="${content.heroSecondaryButtonLink}" class="preview-btn-secondary">${content.heroSecondaryButtonText} →</a>
                  </div>
                </div>
                <div class="preview-hero-visual">
                  <div class="preview-hero-card">
                    <h3 class="preview-pledge-title">${content.pledgeSectionTitle}</h3>
                    ${pledges.length > 0 ? pledges.map((pledge, index) => `
                      <div class="preview-pledge-item">
                        <h4>${pledge.name || `Pledge ${index + 1}`}</h4>
                        <p>${pledge.description || 'No description'}</p>
                      </div>
                    `).join('') : '<p style="text-align: center; color: #4a5d4a;">No pledge items configured</p>'}
                  </div>
                </div>
              </div>
            </section>

            <!-- About Section -->
            <section class="preview-section">
              <div class="preview-section-container">
                <div class="preview-section-header">
                  <h2 class="preview-section-title">${content.aboutSectionTitle}</h2>
                  <p class="preview-section-subtitle">${content.aboutSectionSubtitle}</p>
                </div>
                <div class="preview-about-grid">
                  <div class="preview-about-content">
                    <h3>${content.aboutMissionTitle}</h3>
                    <p>${content.aboutMission}</p>
                    <h3>${content.aboutVisionTitle}</h3>
                    <p>${content.aboutVision}</p>
                  </div>
                  <div class="preview-about-visual">
                    <div class="preview-feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                      ${aboutFeatures.length > 0 ? aboutFeatures.map((feature, index) => `
                        <div class="preview-feature-card" style="background: #e8f5e8; padding: 20px; border-radius: 15px; text-align: center; transition: all 0.3s ease; border: 2px solid transparent;">
                          <div class="preview-feature-icon" style="width: 40px; height: 40px; background: linear-gradient(135deg, #1a5d1a 0%, #2d7a2d 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 1.2rem; color: white; margin-bottom: 10px;">${feature.icon || '📱'}</div>
                          <h4 style="font-size: 1rem; color: #1a2e1a; margin-bottom: 8px;">${feature.title || 'Feature Title'}</h4>
                          <p style="color: #4a5d4a; font-size: 0.9rem;">${feature.description || 'Feature description'}</p>
                        </div>
                      `).join('') : '<p>No features configured</p>'}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Gallery Section -->
            <section class="preview-gallery">
              <div class="preview-section-container">
                <h2>${content.gallerySectionTitle}</h2>
                <p>${content.gallerySectionSubtitle}</p>
                <div class="gallery-embed">
                  <iframe src="${content.galleryEmbedUrl}" title="Gallery"></iframe>
                </div>
              </div>
            </section>

            <!-- Services Section -->
            <section class="preview-section" style="background: linear-gradient(45deg, #f0f8f0, #e8f5e8);">
              <div class="preview-section-container">
                <div class="preview-section-header">
                  <h2 class="preview-section-title">${content.servicesSectionTitle || 'Services'}</h2>
                  <p class="preview-section-subtitle">${content.servicesSectionSubtitle || 'Our services'}</p>
                </div>
                <div class="preview-services-grid">
                  ${services.length > 0 ? services.map((service, index) => `
                    <div class="preview-service-card">
                      <div class="preview-service-number">${index + 1}</div>
                      <h3>${service.title || 'Service Title'}</h3>
                      <p>${service.description || 'Service description'}</p>
                    </div>
                  `).join('') : '<p>No services configured</p>'}
                </div>
              </div>
            </section>

            <!-- Team Section -->
            <section class="preview-section">
              <div class="preview-section-container">
                <div class="preview-section-header">
                  <h2 class="preview-section-title">${content.teamSectionTitle || 'Team'}</h2>
                  <p class="preview-section-subtitle">${content.teamSectionSubtitle || 'Our team'}</p>
                </div>
                <div class="preview-team-grid">
                  ${teamMembers.length > 0 ? teamMembers.map((member, index) => `
                    <div class="preview-team-card">
                      <div class="preview-team-info">
                        <h4>${member.name || 'Team Member'}</h4>
                        <div class="preview-team-role">${member.role || 'Role'}</div>
                        <div class="preview-team-contact">${member.email || 'email@example.com'}</div>
                      </div>
                    </div>
                  `).join('') : '<p>No team members configured</p>'}
                </div>
              </div>
            </section>

            <!-- Contact Section -->
            <section class="preview-contact-section">
              <div class="preview-contact-content">
                <h2>${content.contactSectionTitle || 'Contact'}</h2>
                <p class="preview-contact-intro">${content.contactIntroText || 'Contact intro'}</p>
                <div class="preview-contact-cards">
                  ${contactCards.length > 0 ? contactCards.map((card, index) => `
                    <div class="preview-contact-card">
                      <div class="preview-contact-icon">${card.icon || '📧'}</div>
                      <h3>${card.title || 'Contact Title'}</h3>
                      <p>${card.description || 'Description'}</p>
                      <p>${card.info || 'Contact info'}</p>
                    </div>
                  `).join('') : '<p>No contact cards configured</p>'}
                </div>
                <div class="preview-social-section">
                  <h3>${content.socialSectionTitle || 'Follow Us'}</h3>
                  <div class="preview-social-links">
                    ${socialMedia.length > 0 ? socialMedia.map((social, index) => `
                      <a href="${social.url || '#'}" class="preview-social-link">${social.icon || 'f'}</a>
                    `).join('') : '<p>No social media configured</p>'}
                  </div>
                </div>
              </div>
            </section>

            <!-- Footer -->
            <section class="preview-footer">
              <div class="preview-footer-content">
                <div class="preview-footer-tagline">${content.footerTagline || 'Footer tagline'}</div>
                <div class="preview-footer-links">
                  ${footerLinks.length > 0 ? footerLinks.map((link, index) => `
                    <a href="${link.url || '#'}">${link.text || 'Link'}</a>
                  `).join('') : '<p>No footer links configured</p>'}
                </div>
                <div class="preview-footer-copyright">
                  <p>&copy; ${new Date().getFullYear()} ${content.footerText || 'S-CORE'}</p>
                </div>
              </div>
            </section>
          </div>
        `;

        modal.classList.add('active');
    }

    // Show preview modal
    if (previewBtn) {
        previewBtn.addEventListener('click', showPreview);
    }

    // Save changes via modal confirmation
    if (saveBtn) {
        saveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const modal = document.getElementById('saveConfirmModal');
            modal.classList.add('active');
        });
    }

    // Cancel button opens reset confirm modal
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            const modal = document.getElementById('resetConfirmModal');
            modal.classList.add('active');
        });
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.classList.remove('active');
        }
    }

    // Toast notification function
    function showToast(message, isError = false) {
        const toast = document.getElementById('configToast');
        if (toast) {
            toast.textContent = message;
            toast.style.display = 'block';
            toast.style.background = isError ? '#ef4444' : '#10b981';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }
    }

    // Functions for modal confirmations
      // System tab modal confirmation functions
      function confirmSystemSave() {
        closeSystemSaveConfirm();
        showToast('Saving system configuration...');
        // Submit system config form
        document.getElementById('systemConfigForm').submit();
      }
      function closeSystemSaveConfirm() {
        const modal = document.getElementById('systemSaveConfirmModal');
        modal.classList.remove('active');
      }
      function confirmSystemReset() {
        closeSystemResetConfirm();
        showToast('Resetting system configuration...');
        setTimeout(() => {
          location.reload();
        }, 500);
      }
      function closeSystemResetConfirm() {
        const modal = document.getElementById('systemResetConfirmModal');
        modal.classList.remove('active');
      }
      window.confirmSystemSave = confirmSystemSave;
      window.closeSystemSaveConfirm = closeSystemSaveConfirm;
      window.confirmSystemReset = confirmSystemReset;
      window.closeSystemResetConfirm = closeSystemResetConfirm;

      // Maintenance tab save function
      function confirmMaintenanceSave() {
        showToast('Saving maintenance settings...');
        document.getElementById('maintenanceConfigForm').submit();
      }
      window.confirmMaintenanceSave = confirmMaintenanceSave;

      // About S-CORE tab modal confirmation functions
      function showAboutScorePreview() {
        const previewBody = document.getElementById('aboutScorePreviewContent');
        const modal = document.getElementById('aboutScorePreviewModal');

        const content = {
          sCoreSectionTitle: document.getElementById('sCoreSectionTitle')?.value || 'S-CORE',
          sCorePlatformDescription: document.getElementById('sCorePlatformDescription')?.value || '',
          sCoreWhatIsTitle: document.getElementById('sCoreWhatIsTitle')?.value || 'What is S-CORE?',
          sCoreWhatIsDescription: document.getElementById('sCoreWhatIsDescription')?.value || '',
          sCoreWhyTitle: document.getElementById('sCoreWhyTitle')?.value || 'Why use S-CORE?',
          sCoreWhyDescription: document.getElementById('sCoreWhyDescription')?.value || '',
          sCoreDashboardImage: document.getElementById('sCoreDashboardImage')?.value || '/Picture/dashboard_ss.png',
          sCoreLoginButtonText: document.getElementById('sCoreLoginButtonText')?.value || 'Login',
          sCoreLoginButtonLink: document.getElementById('sCoreLoginButtonLink')?.value || '/index',
          sCoreSignupButtonText: document.getElementById('sCoreSignupButtonText')?.value || 'Sign Up',
          sCoreSignupButtonLink: document.getElementById('sCoreSignupButtonLink')?.value || '/register'
        };

        previewBody.innerHTML = `
          <style>
            .preview-score-page {
              font-family: 'Inter', sans-serif;
              background: linear-gradient(120deg, #e8f5e8 60%, #f0f8f0 100%);
              color: #1a2e1a;
              min-height: 550px;
              position: relative;
              overflow: hidden;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 40px 20px;
            }
            /* Hero Grid - matching homepage.css */
            .preview-hero-grid {
              display: grid;
              grid-template-columns: 1fr 1.3fr;
              column-gap: 64px;
              row-gap: 32px;
              width: 100%;
              max-width: 1100px;
              position: relative;
              z-index: 2;
            }
            /* Left Column */
            .preview-left-column {
              max-width: 520px;
              display: flex;
              flex-direction: column;
              gap: 10px;
            }
            /* Header Card - White card with S-CORE title (matching .about-s-core-header-card) */
            .preview-header-card {
              background: #fff;
              border-radius: 28px;
              box-shadow: 0 4px 32px rgba(20,83,45,0.10);
              padding: 8px 28px 12px 28px;
            }
            .preview-header-card h1 {
              font-family: 'Playfair Display', serif;
              font-size: 2.3rem;
              margin: 0 0 8px 0;
              letter-spacing: 2px;
              background: linear-gradient(120deg, #14532d 0%, #22c55e 50%, #ffd700 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-weight: 700;
            }
            .preview-header-card p {
              font-size: 1.2rem;
              color: #4a5d4a;
              margin: 0;
              font-weight: 500;
            }
            /* Content Card - What is S-CORE (matching .hero-content) */
            .preview-content-card {
              background: #fff;
              border-radius: 28px;
              box-shadow: 0 4px 32px rgba(20,83,45,0.10);
              padding: 32px 28px;
              color: #14532d;
              min-height: 260px;
            }
            .preview-content-card h2 {
              font-family: 'Inter', sans-serif;
              font-size: 1.7rem;
              color: #14532d;
              margin: 0 0 14px 0;
              text-align: left;
            }
            .preview-content-card > p {
              font-size: 1.05rem;
              margin: 0 0 18px 0;
              color: #1a2e1a;
              text-align: left;
              line-height: 1.6;
            }
            /* Buttons */
            .preview-hero-buttons {
              margin-top: 18px;
              display: flex;
              gap: 18px;
              justify-content: flex-start;
            }
            .preview-btn-primary {
              background: linear-gradient(90deg, #2e7d32 60%, #43a047 100%);
              color: #fff !important;
              font-weight: 700;
              padding: 14px 36px;
              border-radius: 10px;
              text-decoration: none;
              font-size: 1.08rem;
              box-shadow: 0 2px 8px rgba(44, 62, 80, 0.10);
              border: none;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .preview-btn-secondary {
              background: #fff;
              color: #2e7d32 !important;
              font-weight: 700;
              padding: 14px 36px;
              border: 2px solid #43a047;
              border-radius: 10px;
              text-decoration: none;
              font-size: 1.08rem;
              box-shadow: 0 2px 8px rgba(44, 62, 80, 0.10);
              display: flex;
              align-items: center;
              gap: 8px;
            }
            /* Right Column */
            .preview-right-column {
              display: flex;
              align-items: flex-start;
              justify-content: flex-end;
            }
            /* Visual Card - Why use S-CORE (matching .hero-card) */
            .preview-visual-card {
              background: #f0f8f0;
              border-radius: 28px;
              padding: 30px 20px;
              box-shadow: 0 10px 30px rgba(26,93,26,0.08);
              text-align: left;
              color: #14532d;
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 100%;
              min-height: 420px;
            }
            .preview-visual-card h3 {
              color: #14532d;
              font-size: 1.3rem;
              margin: 0 0 8px 0;
              text-align: left;
              width: 100%;
              font-weight: 600;
            }
            .preview-visual-card img {
              width: 99%;
              border-radius: 16px;
              margin: 10px 0 20px 0;
              box-shadow: 0 2px 12px rgba(20,83,45,0.10);
            }
            .preview-visual-card .img-placeholder {
              width: 99%;
              height: 180px;
              background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
              border-radius: 16px;
              margin: 10px 0 20px 0;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #166534;
              font-weight: 500;
              font-size: 0.95rem;
            }
            .preview-visual-card > p {
              font-size: 1rem;
              color: #1a2e1a;
              margin: 0;
              text-align: justify;
              width: 100%;
              line-height: 1.6;
            }
            /* Decorative dots */
            .preview-dots-overlay {
              position: absolute;
              inset: 0;
              pointer-events: none;
              z-index: 1;
            }
            .preview-dot {
              position: absolute;
              border-radius: 50%;
              opacity: 0.7;
            }
          </style>
          <div class="preview-score-page">
            <!-- Decorative dots -->
            <div class="preview-dots-overlay">
              <div class="preview-dot" style="width: 12px; height: 12px; background: #FFD700; top: 10%; left: 8%;"></div>
              <div class="preview-dot" style="width: 8px; height: 8px; background: #fff; top: 20%; left: 92%;"></div>
              <div class="preview-dot" style="width: 10px; height: 10px; background: #14532d; top: 70%; left: 3%;"></div>
              <div class="preview-dot" style="width: 14px; height: 14px; background: #FFD700; top: 80%; left: 95%;"></div>
              <div class="preview-dot" style="width: 6px; height: 6px; background: #fff; top: 45%; left: 50%;"></div>
              <div class="preview-dot" style="width: 9px; height: 9px; background: #1a2e1a; top: 35%; left: 15%;"></div>
              <div class="preview-dot" style="width: 7px; height: 7px; background: #FFD700; top: 55%; left: 88%;"></div>
            </div>

            <!-- Hero Grid -->
            <div class="preview-hero-grid">
              <!-- Left Column -->
              <div class="preview-left-column">
                <!-- Header Card -->
                <div class="preview-header-card">
                  <h1>${content.sCoreSectionTitle}</h1>
                  <p>${content.sCorePlatformDescription}</p>
                </div>
                <!-- Content Card -->
                <div class="preview-content-card">
                  <h2>${content.sCoreWhatIsTitle}</h2>
                  <p>${content.sCoreWhatIsDescription}</p>
                  <div class="preview-hero-buttons">
                    <a href="${content.sCoreLoginButtonLink}" class="preview-btn-primary">
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 4px;"><circle cx="11" cy="11" r="10" stroke="#fff" stroke-width="2" fill="#2e7d32"/><path d="M11 13.5C13.4853 13.5 15.5 11.4853 15.5 9C15.5 6.51472 13.4853 4.5 11 4.5C8.51472 4.5 6.5 6.51472 6.5 9C6.5 11.4853 8.51472 13.5 11 13.5Z" stroke="#fff" stroke-width="1.5"/><path d="M4.5 17.5C4.5 15.0147 7.01472 13 11 13C14.9853 13 17.5 15.0147 17.5 17.5" stroke="#fff" stroke-width="1.5"/></svg>
                      ${content.sCoreLoginButtonText}
                    </a>
                    <a href="${content.sCoreSignupButtonLink}" class="preview-btn-secondary">
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 4px;"><rect x="3" y="6" width="16" height="10" rx="3" stroke="#43a047" stroke-width="2" fill="#fff"/><path d="M3 6L11 13L19 6" stroke="#43a047" stroke-width="1.5"/></svg>
                      ${content.sCoreSignupButtonText}
                    </a>
                  </div>
                </div>
              </div>
              <!-- Right Column -->
              <div class="preview-right-column">
                <div class="preview-visual-card">
                  <h3>${content.sCoreWhyTitle}</h3>
                  <img src="${content.sCoreDashboardImage}" alt="S-CORE Dashboard Screenshot" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                  <div class="img-placeholder" style="display: none;">📊 Dashboard Screenshot Preview</div>
                  <p>${content.sCoreWhyDescription}</p>
                </div>
              </div>
            </div>
          </div>
        `;

        modal.classList.add('active');
      }

      function closeAboutScorePreview() {
        const modal = document.getElementById('aboutScorePreviewModal');
        modal.classList.remove('active');
      }

      function confirmAboutScoreSave() {
        closeAboutScoreSaveConfirm();
        showToast('Saving About S-CORE configuration...');
        // Submit the about score config form
        document.getElementById('aboutScoreConfigForm').submit();
      }

      function closeAboutScoreSaveConfirm() {
        const modal = document.getElementById('aboutScoreSaveConfirmModal');
        modal.classList.remove('active');
      }

      function confirmAboutScoreReset() {
        closeAboutScoreResetConfirm();
        showToast('Resetting About S-CORE form...');
        setTimeout(() => {
          location.reload();
        }, 500);
      }

      function closeAboutScoreResetConfirm() {
        const modal = document.getElementById('aboutScoreResetConfirmModal');
        modal.classList.remove('active');
      }

      // Expose About S-CORE functions globally
      window.showAboutScorePreview = showAboutScorePreview;
      window.closeAboutScorePreview = closeAboutScorePreview;
      window.confirmAboutScoreSave = confirmAboutScoreSave;
      window.closeAboutScoreSaveConfirm = closeAboutScoreSaveConfirm;
      window.confirmAboutScoreReset = confirmAboutScoreReset;
      window.closeAboutScoreResetConfirm = closeAboutScoreResetConfirm;

    function closePreview() {
        const modal = document.getElementById('configModal');
        modal.classList.remove('active');
    }

    function confirmSave() {
        closeSaveConfirm();
        showToast('Saving configuration...');
        const form = document.getElementById('configurationForm');
        
        // Submit form normally - backend will handle redirect with success message
        form.submit();
    }

    function closeSaveConfirm() {
        const modal = document.getElementById('saveConfirmModal');
        modal.classList.remove('active');
    }

    function confirmReset() {
        closeResetConfirm();
        showToast('Resetting form...');
        setTimeout(() => {
            location.reload();
        }, 500);
    }

    function closeResetConfirm() {
        const modal = document.getElementById('resetConfirmModal');
        modal.classList.remove('active');
    }

    // Attach to window for global access
    window.closePreview = closePreview;
    window.confirmSave = confirmSave;
    window.closeSaveConfirm = closeSaveConfirm;
    window.confirmReset = confirmReset;
    window.closeResetConfirm = closeResetConfirm;
});

// Developer Credits functions (must be outside DOMContentLoaded for onclick handlers)
function addDeveloperCredit() {
    const container = document.getElementById('developerCreditsContainer');
    const index = container.children.length;
    const itemHtml = `
      <div class="dynamic-item" data-index="${index}">
        <div class="item-header">
          <span class="item-number">Developer ${index + 1}</span>
          <button type="button" class="btn-remove-item" onclick="removeDeveloperCredit(this)">
            <span>×</span>
          </button>
        </div>
        <div class="item-content">
          <div class="form-group">
            <label>Developer Name</label>
            <input type="text" name="developerName[]" maxlength="100" placeholder="e.g., John Doe" required>
          </div>
          <div class="form-group">
            <label>Portfolio URL or Email</label>
            <input type="text" name="developerUrl[]" placeholder="https://portfolio.example.com or email@example.com" required>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', itemHtml);
}

function removeDeveloperCredit(button) {
    if (confirm('Are you sure you want to remove this developer?')) {
        button.closest('.dynamic-item').remove();
        updateDeveloperCreditNumbers();
    }
}

function updateDeveloperCreditNumbers() {
    const items = document.querySelectorAll('#developerCreditsContainer .dynamic-item');
    items.forEach((item, index) => {
        item.querySelector('.item-number').textContent = `Developer ${index + 1}`;
        item.setAttribute('data-index', index);
    });
}