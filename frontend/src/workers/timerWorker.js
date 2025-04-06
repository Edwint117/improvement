let timer = null;
let startTime = null;
let duration = 0;

self.onmessage = (e) => {
  const { action, duration: newDuration } = e.data;

  if (action === 'start') {
    duration = newDuration;
    startTime = Date.now();
    
    timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      
      self.postMessage({
        time: remaining,
        isComplete: remaining === 0
      });

      if (remaining === 0) {
        clearInterval(timer);
      }
    }, 100);
  } else if (action === 'stop') {
    clearInterval(timer);
  }
}; 