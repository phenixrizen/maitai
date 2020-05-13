const maitai = window.location.origin+"/images/maitai.svg"
let options = {
  method: 'GET',
  mode: 'cors',
  cache: 'no-store'
};
let request = new Request(maitai);
fetch(request, options)
  .then((response) => {
    console.log("Got maitai...");
  });
  
let perfData = {};
let perfSent = false;

console.log("Mai Tai as in RUM as in Real User Metrics.....");

let parsePerfEvent = function (e) {
    if (e.entryType === "navigation") {
      console.log('Navigation...', e)

      // Get connection info
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      perfData.connection = {};
      perfData.connection.downlink = connection.downlink;
      perfData.connection.effectiveType = connection.effectiveType;
      perfData.connection.rtt = connection.rtt;


      // Quantifying total connection time
      let pageNav = e;
      perfData.connectionTime = pageNav.connectEnd - pageNav.connectStart;
      perfData.tlsTime = 0; // <-- Assume 0 by default

      // Did any TLS stuff happen?
      if (pageNav.secureConnectionStart > 0) {
        // Awesome! Calculate it!
        perfData.tlsTime = pageNav.connectEnd - pageNav.secureConnectionStart;
      }

      // Cache seek plus response time
      perfData.fetchTime = pageNav.responseEnd - pageNav.fetchStart;

      // Service worker time plus response time
      perfData.workerTime = 0;

      if (pageNav.workerStart > 0) {
          perfData.workerTime = pageNav.responseEnd - pageNav.workerStart;
      }

      // Request time only (excluding unload, redirects, DNS, and connection time)
      perfData.requestTime = pageNav.responseStart - pageNav.requestStart;

      // Response time only (download)
      perfData.responseTime = pageNav.responseEnd - pageNav.responseStart;

      // Request + response time
      perfData.requestResponseTime = pageNav.responseEnd - pageNav.requestStart;

      // HTTP header size
      perfData.headerSize = pageNav.transferSize - pageNav.encodedBodySize;

      // Compression ratio
      perfData.compressionRatio = pageNav.decodedBodySize / pageNav.encodedBodySize;
    } else if (e.entryType === "resource" && e.name === maitai) {
       console.log('Resource...', e)
      // Get timing data for the images
      perfData.imageTime = performance.getEntriesByName(maitai);
    }
    // Perf complete
    if (perfData.imageTime && perfData.connection) {
      if (!perfSent) {
        if ('sendBeacon' in navigator) {
          let data = JSON.stringify(perfData);
          // Beacon the requested
          if (navigator.sendBeacon('/maitai', data)) {
              // sendBeacon worked! We're good!
              console.log('Beacon...', data);
              perfSent = true;
          } else {
              // sendBeacon failed! Use XHR or fetch instead
              console.log('Beacon send failed...');
          }
        } else {
          // sendBeacon not available! Use XHR or fetch instead
          console.log('Cannot send beacon...');
        }
      }
    }
}

// Instantiate the performance observer
let perfObserver = new PerformanceObserver(function(list, obj) {
  // Get all the resource entries collected so far
  // (You can also use getEntriesByType/getEntriesByName here)
  let entries = list.getEntries();

  // Iterate over entries
  for (let i = 0; i < entries.length; i++) {
    parsePerfEvent(entries[i]);
  }
});

// Run the observer
perfObserver.observe({
  // Polls for Navigation and Resource Timing entries
  entryTypes: ["navigation", "resource"]
});