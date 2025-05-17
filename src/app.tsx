/// <reference types="preact/jsx-runtime" />
import { useEffect, useState } from 'preact/hooks';
import { Wheel } from './Wheel';
import { Github } from 'lucide-preact';

// Data for selected site in modal
interface ModalData { title: string; link: string; favicon?: string; }

export function App() {
  const [websites, setWebsites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for modal display after spin
  const [modalData, setModalData] = useState<ModalData | null>(null);
  // State for favicon loading
  const [faviconLoading, setFaviconLoading] = useState(false);
  const [faviconError, setFaviconError] = useState(false); // New state for favicon error

  useEffect(() => {
    // Fetch the websites from the text file
    fetch('/data/websites.txt')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load websites');
        }
        return response.text();
      })
      .then(text => {
        // Parse the text file and filter out the first line (comment) and empty lines
        const lines = text.split('\n')
          .filter((line, index) => index > 0 && line.trim() !== '');
        setWebsites(lines);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading websites:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function randomPage() {
    if (websites.length === 0) {
      alert('No websites available!');
      return;
    }

    // Select a random website from the list
    const randomIndex = Math.floor(Math.random() * websites.length);
    const randomWebsite = websites[randomIndex];
    
    // Add https:// prefix if not present
    const url = randomWebsite.startsWith('http') 
      ? randomWebsite 
      : `https://${randomWebsite}`;
    
    // Navigate to the random website
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Handle selection from wheel
  function handleSpinSelect(site: string) {
    const url = site.startsWith('http') ? site : `https://${site}`;
    
    let faviconUrl = '';
    let displayTitle = '';
    let canLoadFavicon = false; 
    
    try {
      const urlObj = new URL(url); 
      const domain = urlObj.hostname;
      if (domain) { 
        faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
        canLoadFavicon = true;
        
        // Check for special cases first
        if (domain.includes('google')) {
          displayTitle = 'Google';
        } else if (domain.includes('wikipedia')) {
          displayTitle = 'Wikipedia';
        } else if (domain.includes('youtube')) {
          displayTitle = 'YouTube';
        } else if (domain.includes('facebook')) {
          displayTitle = 'Facebook';
        } else if (domain.includes('twitter') || domain.includes('x.com')) {
          displayTitle = 'Twitter/X';
        } else if (domain.includes('instagram')) {
          displayTitle = 'Instagram';
        } else if (domain.includes('amazon')) {
          displayTitle = 'Amazon';
        } else if (domain.includes('github')) {
          displayTitle = 'GitHub';
        } else if (domain.includes('linkedin')) {
          displayTitle = 'LinkedIn';
        } else if (domain.includes('netflix')) {
          displayTitle = 'Netflix';
        } else if (domain.includes('reddit')) {
          displayTitle = 'Reddit';
        } else {
          // Default processing for other domains
          displayTitle = domain.replace(/^www\./, '');
          displayTitle = displayTitle.split('.')[0] 
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
        }
      } else {
        displayTitle = site; 
      }
    } catch (e) {
      console.error("Error processing URL for favicon/title:", e);
      displayTitle = site; 
    }
    
    if (canLoadFavicon) {
      setFaviconLoading(true);
    } else {
      setFaviconLoading(false); 
    }
    setFaviconError(false); 
    
    setModalData({ 
      title: displayTitle, 
      link: url, 
      favicon: faviconUrl 
    });
  }

  // Handle favicon loaded
  function handleFaviconLoaded() {
    setFaviconLoading(false);
    setFaviconError(false);
  }

  // Handle favicon error
  function handleFaviconError() {
    setFaviconLoading(false);
    setFaviconError(true);
  }

  // Close modal
  function closeModal() {
    setModalData(null);
  }

  // Close modal on backdrop click
  function handleBackdropClick(event: preact.JSX.TargetedMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 relative p-4">
      {/* GitHub link in top right corner */}
      <a 
        href="https://github.com/marcelytumy/imfeelinglucky" 
        target="_blank" 
        rel="noopener noreferrer"
        className="absolute top-4 right-4 flex items-center justify-center p-2 bg-white dark:bg-gray-700 rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-600"
        aria-label="View on GitHub"
      >
        <Github className="w-6 h-6 text-gray-800 dark:text-white" />
      </a>
      
      <div className="p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center w-full max-w-lg">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-gray-800 dark:text-gray-100">
          I'm Feeling Lucky
        </h1>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">
            Error: {error}
          </div>
        )}
        {loading || error ? (
          <button
            className="px-10 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium tracking-wide shadow-lg cursor-not-allowed opacity-70 transition-all"
            onClick={randomPage}
            disabled
            aria-busy={loading}
          >
            {loading ? 'Loading websites...' : 'Go to random page'}
          </button>
        ) : (
          <>
            <Wheel websites={websites} onSelect={handleSpinSelect} />
            {modalData && (
              <div 
                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 p-4 z-50"
                onClick={handleBackdropClick}
              >
                <div 
                  className="bg-white dark:bg-gray-800 p-6 pt-10 sm:p-8 sm:pt-12 rounded-lg shadow-2xl text-center max-w-sm sm:max-w-md w-full relative"
                  onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to backdrop
                >
                  <button
                    onClick={closeModal}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    aria-label="Close modal"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                  
                  <div className="mx-auto mb-5 w-20 h-20 flex items-center justify-center border dark:border-gray-700 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {/* Render img tag if a favicon URL exists. It will be hidden by CSS if loading or error, and shown on success. */}
                    {modalData.favicon && (
                      <img 
                        src={modalData.favicon} 
                        alt="Favicon"
                        className={`w-full h-full object-cover ${faviconLoading || faviconError ? 'hidden' : 'block'}`}
                        onLoad={handleFaviconLoaded}
                        onError={handleFaviconError}
                        key={modalData.favicon} 
                      />
                    )}

                    {/* Show spinner only when actively loading and a favicon is expected */}
                    {faviconLoading && modalData.favicon && (
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent border-dashed rounded-full animate-spin"></div>
                    )}

                    {/* Show fallback SVG if:
                        1. Not loading, but there was an error (and we attempted to load a favicon).
                        2. Or, if there's no favicon URL to even attempt loading (and not currently in a loading state for it).
                    */}
                    {((!faviconLoading && faviconError && modalData.favicon) || 
                      (!modalData.favicon && !faviconLoading)) && (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-10 h-10 text-gray-400 dark:text-gray-500">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21.75 12H17.25" />
                      </svg>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    {modalData.title}
                  </h2>
                  <a href={modalData.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 break-all text-sm sm:text-base block mb-6">
                    {modalData.link}
                  </a>
                  <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8">
                    <button
                      onClick={() => {
                        if (modalData?.link) {
                          window.open(modalData.link, '_blank', 'noopener,noreferrer');
                        }
                        // Optionally close modal: closeModal(); 
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      Go to Website
                    </button>
                    <button
                      onClick={closeModal}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 rounded-lg font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                    >
                      Spin Again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {websites.length > 0 && !loading && !error && (
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            {websites.length} awesome websites ready to explore!
          </p>
        )}
      </div>
    </div>
  );
}
