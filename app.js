// Global variables
let churchesData = [];
let filteredChurches = [];
let searchTimeout;
const DEBOUNCE_DELAY = 300;

// DOM elements
let searchInput;
let regionFilter;
let churchesGrid;
let noResults;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    loadChurchData();
    initializeEventListeners();
    initializeAnimations();
});

// Initialize DOM elements
function initializeDOMElements() {
    searchInput = document.getElementById('search-input');
    regionFilter = document.getElementById('region-filter');
    churchesGrid = document.getElementById('churches-grid');
    noResults = document.getElementById('no-results');
}

// Load church data from JSON script tag
function loadChurchData() {
    try {
        const dataScript = document.getElementById('church-data');
        const data = JSON.parse(dataScript.textContent);
        churchesData = data.churches || [];
        filteredChurches = [...churchesData];
        renderChurches();
    } catch (error) {
        console.error('Error loading church data:', error);
        showError('Unable to load church directory. Please try again later.');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    if (!searchInput || !regionFilter) {
        console.error('Required DOM elements not found');
        return;
    }

    // Search input with debounce
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterChurches();
        }, DEBOUNCE_DELAY);
    });

    // Region filter
    regionFilter.addEventListener('change', function(e) {
        filterChurches();
    });

    // Handle search on Enter key
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            filterChurches();
        }
    });
}

// Initialize intersection observer for animations
function initializeAnimations() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Skip animations for users who prefer reduced motion
        const cards = document.querySelectorAll('.church-card');
        cards.forEach(card => card.classList.add('visible'));
        return;
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all church cards
    const observeCards = () => {
        const cards = document.querySelectorAll('.church-card:not(.visible)');
        cards.forEach(card => observer.observe(card));
    };

    // Initial observation
    setTimeout(observeCards, 100);
    
    // Store function globally for reuse
    window.observeCards = observeCards;
}

// Filter churches based on search and region
function filterChurches() {
    if (!searchInput || !regionFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedRegion = regionFilter.value;

    filteredChurches = churchesData.filter(church => {
        // Search filter - check multiple fields
        const matchesSearch = !searchTerm || 
            church.name.toLowerCase().includes(searchTerm) ||
            church.pastor.toLowerCase().includes(searchTerm) ||
            church.address.toLowerCase().includes(searchTerm) ||
            (church.town && church.town.toLowerCase().includes(searchTerm)) ||
            (church.region && church.region.toLowerCase().includes(searchTerm));

        // Region filter
        const matchesRegion = !selectedRegion || church.region === selectedRegion;

        return matchesSearch && matchesRegion;
    });

    renderChurches();
}

// Render church cards
function renderChurches() {
    if (!churchesGrid || !noResults) return;

    if (filteredChurches.length === 0) {
        churchesGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    churchesGrid.style.display = 'grid';
    noResults.style.display = 'none';

    const cardsHTML = filteredChurches.map(church => createChurchCard(church)).join('');
    churchesGrid.innerHTML = cardsHTML;

    // Re-initialize animations for new cards
    if (window.observeCards && typeof window.observeCards === 'function') {
        setTimeout(window.observeCards, 100);
    }

    // Add event listeners to new cards
    initializeCardEventListeners();
}

// Create HTML for a church card
function createChurchCard(church) {
    const isMission = church.type === 'mission';
    const hasPhone = church.contact?.phone;
    const hasEmail = church.contact?.email;
    const hasWebsite = church.website;
    const mapsUrl = church.mapsUrl || generateMapsUrl(church.address);

    return `
        <article class="church-card" data-church="${escapeHtml(church.name)}">
            <header class="church-card__header">
                <h2 class="church-card__name">${escapeHtml(church.name)}</h2>
                ${isMission ? '<span class="church-card__badge">Mission</span>' : ''}
            </header>
            
            <div class="church-card__content">
                <address class="church-card__address">
                    <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                    <span>${escapeHtml(church.address)}</span>
                </address>
                
                <div class="church-card__pastor">
                    <i class="fas fa-user" aria-hidden="true"></i>
                    <span>${escapeHtml(church.pastor)}</span>
                </div>
                
                ${(hasPhone || hasEmail) ? `
                    <div class="church-card__contact">
                        ${hasPhone ? `
                            <div class="church-card__contact-item">
                                <i class="fas fa-phone" aria-hidden="true"></i>
                                <a href="tel:${escapeHtml(church.contact.phone)}" 
                                   aria-label="Call ${escapeHtml(church.contact.phone)}">
                                    ${escapeHtml(church.contact.phone)}
                                </a>
                            </div>
                        ` : ''}
                        ${hasEmail ? `
                            <div class="church-card__contact-item">
                                <i class="fas fa-envelope" aria-hidden="true"></i>
                                <a href="mailto:${escapeHtml(church.contact.email)}" 
                                   aria-label="Email ${escapeHtml(church.contact.email)}">
                                    ${escapeHtml(church.contact.email)}
                                </a>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
            
            <footer class="church-card__actions">
                <button class="church-card__btn church-card__btn--primary map-btn" 
                        data-maps-url="${escapeHtml(mapsUrl)}"
                        aria-label="View ${escapeHtml(church.name)} location on Google Maps">
                    <i class="fas fa-map" aria-hidden="true"></i>
                    View Map
                </button>
                
                ${hasWebsite ? `
                    <a href="${escapeHtml(church.website)}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="church-card__btn church-card__btn--secondary"
                       aria-label="Visit ${escapeHtml(church.name)} website (opens in new tab)">
                        <i class="fas fa-globe" aria-hidden="true"></i>
                        Website
                    </a>
                ` : `
                    <span class="church-card__btn church-card__btn--disabled" 
                          aria-label="No website available">
                        <i class="fas fa-globe" aria-hidden="true"></i>
                        No website listed
                    </span>
                `}
            </footer>
        </article>
    `;
}

// Initialize event listeners for card buttons
function initializeCardEventListeners() {
    // Map buttons
    const mapButtons = document.querySelectorAll('.map-btn');
    mapButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const mapsUrl = this.getAttribute('data-maps-url');
            if (mapsUrl) {
                window.open(mapsUrl, '_blank', 'noopener,noreferrer');
            }
        });
    });
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Generate Google Maps URL if missing
function generateMapsUrl(address) {
    if (!address) return '';
    return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

// Show error message
function showError(message) {
    if (!churchesGrid) return;
    
    churchesGrid.innerHTML = `
        <div class="error-message">
            <div class="error-message__content">
                <i class="fas fa-exclamation-triangle error-message__icon" aria-hidden="true"></i>
                <h3>Error</h3>
                <p>${escapeHtml(message)}</p>
            </div>
        </div>
    `;
    
    if (noResults) {
        noResults.style.display = 'none';
    }
}

// Handle search input focus for better UX
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            this.select();
        });
    }
});

// Handle keyboard navigation
document.addEventListener('keydown', function(event) {
    const searchInput = document.getElementById('search-input');
    // Clear search on Escape
    if (event.key === 'Escape' && searchInput && document.activeElement === searchInput) {
        searchInput.value = '';
        filterChurches();
    }
});

// Debug logging for development
function debugLog(message, data = null) {
    if (console && console.log) {
        if (data) {
            console.log(`Church Directory: ${message}`, data);
        } else {
            console.log(`Church Directory: ${message}`);
        }
    }
}

// Initialize debug logging
debugLog('App initialized');

// Export functions for testing
if (typeof window !== 'undefined') {
    window.ChurchDirectory = {
        filterChurches,
        escapeHtml,
        generateMapsUrl,
        debugLog
    };
}