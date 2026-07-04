const unitsLinkDisplay = {
  init() {
    this.setupLinkDisplay();
  },

  setupLinkDisplay() {
    window.showLinksModal = function(request) {
      const linksSection = document.getElementById('linksSection');
      const modalLinksContainer = document.getElementById('modalLinks');
      
      if (!request || !request.links || request.links.length === 0) {
        linksSection.style.display = 'none';
        modalLinksContainer.innerHTML = '';
        return;
      }
      
      linksSection.style.display = 'block';
      modalLinksContainer.innerHTML = '';
      
      const linksList = document.createElement('ul');
      linksList.className = 'links-list';
      
      request.links.forEach(function(link) {
        const listItem = document.createElement('li');
        
        const linkElement = document.createElement('a');
        linkElement.href = link;
        linkElement.target = '_blank';
        linkElement.className = 'link-item';
        linkElement.title = link;
        linkElement.textContent = link.length > 50 ? link.substring(0, 47) + '...' : link;
        
        listItem.appendChild(linkElement);
        linksList.appendChild(listItem);
      });
      
      modalLinksContainer.appendChild(linksList);
    };

    window.hideLinksSection = function() {
      const linksSection = document.getElementById('linksSection');
      if (linksSection) {
        linksSection.style.display = 'none';
      }
    };

    window.closeRequestModal = function() {
      const modal = document.getElementById('requestDetailsModal');
      if (modal) {
        modal.style.display = 'none';
      }
      window.hideLinksSection();
    };

    window.closeDetailsModal = function() {
      const modal = document.getElementById('detailsModal');
      if (modal) {
        modal.style.display = 'none';
      }
      window.hideLinksSection();
    };

    window.openTeamChatBtn = window.openTeamChatBtn || function(requestId) {
      if (typeof openTeamConversationModal === 'function') {
        openTeamConversationModal(requestId);
      } else if (typeof openConversation === 'function') {
        openConversation(requestId);
      }
    };

    window.openTeamChatFromModal = window.openTeamChatFromModal || function(requestId) {
      if (typeof openTeamConversationModal === 'function') {
        openTeamConversationModal(requestId);
      } else if (typeof openConversation === 'function') {
        openConversation(requestId);
      }
    };

    window.openChatFromModal = window.openChatFromModal || function(requestId) {
      if (typeof openTeamConversationModal === 'function') {
        openTeamConversationModal(requestId);
      } else if (typeof openConversation === 'function') {
        openConversation(requestId);
      }
    };
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    unitsLinkDisplay.init();
  });
} else {
  unitsLinkDisplay.init();
}
