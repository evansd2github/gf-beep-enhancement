// Original Author: Christopher Masto <chris@masto.com>
// Conversion to manifest v3 and new Glowforge interface: David Evans <evansd2@gmail.com>
'use strict';

// Initialize audio variables
let readyAudio = null;

// Initialize audio in response to user interaction
function initAudio() {
  if (!readyAudio) {
    readyAudio = new Audio(chrome.runtime.getURL("sounds/ready.mp3"));
    // Preload the audio
    readyAudio.load();
    //console.log("Audio initialized");
  }
}

// Try to initialize audio on first user interaction with the page.
// This is unfortunate, there are cases where the page will be open and the glowforge is turned on.
// Ideally it would play a sound when it's done centering the laser even if the user hasn't done anything.
// these are largely unnecessary, it should have been init'ed on page load, but there is no practical performance hit 
// since it is aware if it's already been run.
document.addEventListener('click', function() {
  initAudio();
}, { once: true });

document.addEventListener('keydown', function() {
  initAudio();
}, { once: true });

document.addEventListener('wheel', function() {
  initAudio();
}, { once: true });

// Load the audio when the page loads too, in case autoplay is allowed
window.addEventListener('load', function() {
  console.log("GF Beep extension loaded");
  initAudio();
});

// We use the scanning attribute to decide when to beep
var isScanning = false;
var checkAndBeep = function () {
  
  //determine if we're in a scanning state.
  if (document.querySelector('div.MachineStatusIcon.scanning')) {
      isScanning = true;
  }
  else {
    if (isScanning) {
      // It was just scanning, but now the scanner is missing, so it means we're ready.
      // Make sure audio is initialized
      if (!readyAudio) {
        initAudio();
        }
      
      // Try to play the sound
      var promise = readyAudio.play();
      if (promise !== undefined) {
        promise.then(_ => {
        }).catch(error => {
          // If playback fails, re-initialize audio for next attempt
          readyAudio = null;
          initAudio();
        });
      }
    }    
    isScanning = false;
  }
};

// Define an observer and a function to attach it
var beepObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    checkAndBeep();
  });
});

var attachBeepObserver = function () {
  var el = document.querySelector('div.print-button');
  if (el) {
    beepObserver.observe(el, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    
    // Do an initial check
    checkAndBeep();
  }
  else {
    // didn't find a print button, this is a problem.
    // Try again in a few seconds in case the UI is still loading
    setTimeout(attachBeepObserver, 3000);
  }
};

// This watches for navigation from the dashboard to the design editor, and
// attaches the observer when that happens.
new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type == 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.matches('.NavbarDesignNameEditor')) {
          //console.log("Detected navigation to design editor");
          attachBeepObserver();
        }
      });
    }
  });
}).observe(document.querySelector('div.TopNavV2') || document.body, {
  childList: true,
  subtree: true
});


// Try to attach when the page is loaded
//console.log("Attempting initial observer attachment");
setTimeout(attachBeepObserver, 1000); // Give the page a moment to load
