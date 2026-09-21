/**
 * Centralized Google Identity Services (GSI) Helper
 * 
 * Ensures:
 * 1. Single injection and loading of the GSI script.
 * 2. Exactly ONE call to google.accounts.id.initialize() per client lifecycle.
 * 3. Prevents duplicate initializations from React StrictMode, component re-renders, or multiple components.
 * 4. Safe button rendering only after the GSI script and container element are ready.
 */

let gsiScriptPromise = null;
let isInitialized = false;
let currentClientId = null;
let activeCredentialCallback = null;

/**
 * Loads the Google Identity Services SDK script once and caches the promise.
 */
export function loadGsiScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Browser window is required to load Google Identity Services.'));
  }

  // If already available on window, resolve immediately
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }

  // Return existing in-flight promise to avoid duplicate script tags
  if (gsiScriptPromise) {
    return gsiScriptPromise;
  }

  gsiScriptPromise = new Promise((resolve, reject) => {
    // Check if script tag is already in DOM
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
        return;
      }
      existingScript.addEventListener('load', () => {
        if (window.google?.accounts?.id) {
          resolve(window.google.accounts.id);
        } else {
          reject(new Error('Google Identity Services script loaded but accounts.id is undefined.'));
        }
      });
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        reject(new Error('Google Identity Services script loaded but accounts.id is undefined.'));
      }
    };
    script.onerror = (err) => {
      gsiScriptPromise = null; // allow retry if network failed
      reject(err);
    };
    document.head.appendChild(script);
  });

  return gsiScriptPromise;
}

/**
 * Initializes Google Identity Services client exactly ONCE.
 * Subscribes the global callback to dispatch to whichever component is currently active.
 */
export async function initializeGsiOnce(clientId) {
  if (!clientId) {
    throw new Error('Google OAuth client_id is required.');
  }

  await loadGsiScript();

  if (isInitialized && currentClientId === clientId) {
    return window.google.accounts.id;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      use_fedcm_for_prompt: false,
      callback: (res) => {
        if (res?.credential && typeof activeCredentialCallback === 'function') {
          activeCredentialCallback(res.credential, res);
        }
      }
    });

    isInitialized = true;
    currentClientId = clientId;

    if (import.meta.env.DEV) {
      console.info(
        `[GraminArogya GSI] Initialized successfully for origin "${window.location.origin}". ` +
        `Ensure this exact origin (protocol + hostname + port) is configured in Google Cloud Console > Authorized JavaScript origins.`
      );
    }
  } catch (err) {
    console.error('[GraminArogya GSI] Initialization failed:', err);
    throw err;
  }

  return window.google.accounts.id;
}

/**
 * Sets the active handler that will receive credentials when Google Sign-In completes.
 */
export function setGoogleCredentialListener(callback) {
  activeCredentialCallback = callback;
}

/**
 * Safely renders the Google Sign-In button into a DOM container element.
 * Guarantees the script is ready, GSI is initialized once, and stale button elements are cleared.
 */
export async function renderGoogleButtonSafely(containerEl, clientId, options = {}, onCredential) {
  if (!containerEl || !clientId) return false;

  await initializeGsiOnce(clientId);

  if (onCredential) {
    activeCredentialCallback = onCredential;
  }

  // Clear previous DOM children to prevent duplicate buttons on re-renders
  containerEl.innerHTML = '';

  window.google.accounts.id.renderButton(containerEl, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    ...options
  });

  return true;
}

/**
 * Prompts Google One Tap if requested.
 */
export async function promptGoogleOneTap(clientId, onCredential, onNotDisplayed) {
  if (!clientId) return;
  await initializeGsiOnce(clientId);
  if (onCredential) {
    activeCredentialCallback = onCredential;
  }
  window.google.accounts.id.prompt((notification) => {
    if ((notification.isNotDisplayed() || notification.isSkippedMoment()) && onNotDisplayed) {
      onNotDisplayed(notification);
    }
  });
}
