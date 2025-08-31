// Global variables
let churchesData = [];
let filteredChurches = [];
let searchTimeout;
const DEBOUNCE_DELAY = 300;

// DOM elements
let searchInput;
let regionFilter;
let typeFilter;
let churchesGrid;
let noResults;

// Carousel variables
let currentSlide = 0;
let totalSlides = 0;
let carouselInterval;
const CAROUSEL_INTERVAL = 5000; // 5 seconds

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    loadChurchData();
    initializeEventListeners();
    initializeAnimations();
    initializeCarousel();
});

// Initialize DOM elements
function initializeDOMElements() {
    searchInput = document.getElementById('search-input');
    regionFilter = document.getElementById('region-filter');
    typeFilter = document.getElementById('type-filter');
    churchesGrid = document.getElementById('churches-grid');
    noResults = document.getElementById('no-results');
}

// Load church data from JSON script tag
function loadChurchData() {
    try {
        const dataScript = document.getElementById('church-data');
        const data = JSON.parse(dataScript.textContent);
        churchesData = data.churches || [];

        // Ensure all churches have a type (default to 'church' if not specified)
        churchesData = churchesData.map(church => ({
            ...church,
            type: church.type || 'church'
        }));

        filteredChurches = [...churchesData];
        renderChurches();
    } catch (error) {
        console.error('Error loading church data:', error);
        showError('Unable to load church directory. Please try again later.');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    if (!searchInput || !regionFilter || !typeFilter) {
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

    // Type filter
    typeFilter.addEventListener('change', function(e) {
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

// Initialize carousel
function initializeCarousel() {
    const carouselSlides = document.getElementById('carousel-slides');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const indicators = document.querySelectorAll('.carousel-indicator');

    if (!carouselSlides) return;

    totalSlides = document.querySelectorAll('.carousel-slide').length;

    if (totalSlides === 0) return;

    // Previous button
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentSlide - 1);
        });
    }

    // Next button
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide(currentSlide + 1);
        });
    }

    // Indicators
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    // Auto-play carousel
    startCarouselAutoPlay();

    // Pause auto-play on hover
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', stopCarouselAutoPlay);
        carousel.addEventListener('mouseleave', startCarouselAutoPlay);
    }

    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.target.closest('.carousel')) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToSlide(currentSlide - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goToSlide(currentSlide + 1);
            }
        }
    });
}

// Go to specific slide
function goToSlide(slideIndex) {
    const carouselSlides = document.getElementById('carousel-slides');
    const indicators = document.querySelectorAll('.carousel-indicator');

    if (!carouselSlides || totalSlides === 0) return;

    // Handle wrap-around
    if (slideIndex < 0) {
        currentSlide = totalSlides - 1;
    } else if (slideIndex >= totalSlides) {
        currentSlide = 0;
    } else {
        currentSlide = slideIndex;
    }

    // Update slides position
    const translateX = -currentSlide * 100;
    carouselSlides.style.transform = `translateX(${translateX}%)`;

    // Update indicators
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
}

// Start carousel auto-play
function startCarouselAutoPlay() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    stopCarouselAutoPlay(); // Clear any existing interval
    carouselInterval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, CAROUSEL_INTERVAL);
}

// Stop carousel auto-play
function stopCarouselAutoPlay() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

// Filter churches based on search, region, and type
function filterChurches() {
    if (!searchInput || !regionFilter || !typeFilter) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedRegion = regionFilter.value;
    const selectedType = typeFilter.value;

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

        // Type filter
        const matchesType = !selectedType || church.type === selectedType;

        return matchesSearch && matchesRegion && matchesType;
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
    const isChurch = church.type === 'church';
    const hasPhone = church.contact?.phone;
    const hasEmail = church.contact?.email;
    const hasWebsite = church.website;
    const mapsUrl = church.mapsUrl || generateMapsUrl(church.address);

    return `
        <article class="church-card" data-church="${escapeHtml(church.name)}">
            <header class="church-card__header">
                <h2 class="church-card__name">${escapeHtml(church.name)}</h2>
                ${isMission ? '<span class="church-card__badge">Mission</span>' : ''}
                ${isChurch ? '<span class="church-card__badge church-card__badge--church">Church</span>' : ''}
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

// Initialize card event listeners
function initializeCardEventListeners() {
    // Map buttons
    const mapButtons = document.querySelectorAll('.map-btn');
    mapButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const mapsUrl = this.getAttribute('data-maps-url');
            if (mapsUrl) {
                window.open(mapsUrl, '_blank', 'noopener,noreferrer');
            }
        });
    });
}

// Generate Google Maps URL
function generateMapsUrl(address) {
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error message
function showError(message) {
    // Create or update error display
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'error-message';
        errorElement.setAttribute('role', 'alert');

        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(errorElement, container.firstChild);
        }
    }

    errorElement.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
    errorElement.style.display = 'block';

    // Auto-hide error after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    stopCarouselAutoPlay();
});