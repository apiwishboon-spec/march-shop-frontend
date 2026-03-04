// Auto-redirect from old domain to new domain
(function() {
  const currentHost = window.location.hostname;
  const currentPath = window.location.pathname + window.location.search + window.location.hash;
  
  // Redirect from art-ink.pages.dev to chromink.pages.dev
  if (currentHost === 'art-ink.pages.dev') {
    console.log('Redirecting from art-ink.pages.dev to chromink.pages.dev');
    window.location.replace('https://chromink.pages.dev' + currentPath);
    return;
  }
})();
