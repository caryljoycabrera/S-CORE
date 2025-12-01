// configuration.js
// Handles preview, save, and reset modals for configuration page

document.addEventListener('DOMContentLoaded', function () {
    console.log('Configuration.js loaded');
    
    // Modal logic
    const previewBtn = document.getElementById('previewBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const modal = document.getElementById('configModal');
    const modalContent = document.getElementById('modalContent');
    const toast = document.getElementById('configToast');
    
    console.log('Save button found:', saveBtn);

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
            sCoreSectionTitle: document.getElementById('sCoreSectionTitle')?.value || '',
            sCorePlatformDescription: document.getElementById('sCorePlatformDescription')?.value || '',
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
            .preview-btn-primary { background: linear-gradient(135deg, #1a5d1a 0%, #2d7a2d 100%); color: white; padding: 12px 25px; border-radius: 25px; text-decoration: none; font-weight: 600; display: inline-block; }
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
        console.log('Attaching click handler to save button');
        saveBtn.addEventListener('click', function (e) {
            console.log('Save button clicked!');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('About to call confirmSave()');
            confirmSave();
        });
    } else {
        console.error('Save button not found!');
    }

    // Cancel button opens reset confirm modal
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            confirmReset();
        });
    }

    // Prevent form from submitting without confirmation
    const configForm = document.getElementById('configurationForm');
    if (configForm) {
        configForm.addEventListener('submit', function (e) {
            e.preventDefault();
            return false;
        });
    }

    // System save button with confirmation
    const systemSaveBtn = document.getElementById('systemSaveBtn');
    if (systemSaveBtn) {
        systemSaveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (confirm('Are you sure you want to save system configuration changes?')) {
                const form = document.getElementById('systemConfigForm');
                form.submit();
            }
        });
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.classList.remove('active');
        }
    }

    // Toast logic (for future use if needed)
    function showToast(message) {
        if (toast) {
            toast.textContent = message;
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }
    }

    // Functions for modal confirmations
    function closePreview() {
        const modal = document.getElementById('configModal');
        modal.classList.remove('active');
    }

    function confirmSave() {
        console.log('confirmSave() called');
        const confirmed = confirm('Are you sure you want to save these changes? This will update the homepage configuration.');
        console.log('User confirmed:', confirmed);
        if (confirmed) {
            const form = document.getElementById('configurationForm');
            console.log('Submitting form:', form);
            form.submit();
        }
    }

    function closeSaveConfirm() {
        const modal = document.getElementById('saveConfirmModal');
        modal.classList.remove('active');
    }

    function confirmReset() {
        if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
            location.reload();
        }
    }

    function closeResetConfirm() {
        const modal = document.getElementById('resetConfirmModal');
        modal.classList.remove('active');
    }

    // System config form validation
    const systemConfigForm = document.getElementById('systemConfigForm');
    if (systemConfigForm) {
        systemConfigForm.addEventListener('submit', (e) => {
            const organizationsList = document.getElementById('organizationsList');
            if (organizationsList && !organizationsList.value.trim()) {
                e.preventDefault();
                alert('Please add at least one organization.');
                organizationsList.focus();
                return false;
            }
            return true;
        });
    }

    // Tab logic
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'homepage') {
        switchTab('homepage');
    } else {
        switchTab('system');
    }

    // Attach to window for global access
    window.closePreview = closePreview;
    window.confirmSave = confirmSave;
    window.confirmReset = confirmReset;
});
