// Auto-updating copyright system for Chromink
(function() {
    'use strict';
    
    // Get current year
    const currentYear = new Date().getFullYear();
    const startYear = 2026; // Year Chromink was established
    
    // Format copyright text
    let copyrightText = `© ${currentYear} Chromink`;
    
    // Show range if different from start year
    if (currentYear > startYear) {
        copyrightText = `© ${startYear}-${currentYear} Chromink`;
    }
    
    // Function to update copyright elements
    function updateCopyright() {
        // Find all elements with copyright class
        const copyrightElements = document.querySelectorAll('.copyright, .site-footer-bar, [data-copyright]');
        
        copyrightElements.forEach(element => {
            // Check if element contains copyright text
            if (element.textContent.includes('©') || element.hasAttribute('data-copyright')) {
                // Update existing copyright
                element.innerHTML = element.innerHTML.replace(/©\s*\d{4}(-\d{4})?\s*Chromink/g, copyrightText);
            }
        });
        
        // Find and update specific copyright patterns
        const patterns = [
            /©\s*\d{4}(-\d{4})?\s*Chromink/g,
            /Copyright\s*\(c\)\s*\d{4}(-\d{4})?\s*Chromink/gi
        ];
        
        // Update all text nodes that contain copyright
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            patterns.forEach(pattern => {
                if (pattern.test(node.textContent)) {
                    node.textContent = node.textContent.replace(pattern, copyrightText);
                }
            });
        }
    }
    
    // Function to add copyright to footer if not present
    function addCopyrightToFooter() {
        const footers = document.querySelectorAll('footer, .site-footer, .site-footer-bar');
        
        footers.forEach(footer => {
            // Check if copyright already exists
            if (!footer.textContent.includes('©') && !footer.textContent.includes('Chromink')) {
                // Add copyright to footer
                const copyrightSpan = document.createElement('span');
                copyrightSpan.className = 'copyright';
                copyrightSpan.innerHTML = ` &nbsp;·&nbsp; ${copyrightText}`;
                footer.appendChild(copyrightSpan);
            }
        });
    }
    
    // Initialize copyright system
    function initCopyright() {
        updateCopyright();
        addCopyrightToFooter();
        
        // Log copyright update for debugging
        console.log(`🎨 Chromink Copyright updated: ${copyrightText}`);
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCopyright);
    } else {
        initCopyright();
    }
    
    // Export for external use
    window.ChrominkCopyright = {
        update: updateCopyright,
        getText: () => copyrightText,
        getYear: () => currentYear
    };
    
})();
