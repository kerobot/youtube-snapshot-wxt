import { snapshotShowFps } from "@/utils/storage";
import { FrameRateCalculator } from "@/utils/frame-rate-calculator";

export default defineContentScript({
  matches: ['*://www.youtube.com/*'],
  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      onMount: () => {
        const observer = new MutationObserver(async () => {
          addButtons();

          const showFps = await snapshotShowFps.getValue();
          if (showFps) {
            createFrameRateDisplay();
          }

          snapshotShowFps.watch(async (showFps) => {
            if (showFps) {
                createFrameRateDisplay();
            } else {
                removeFrameRateDisplay();
            }
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });
      },
    });
    ui.mount();
  }
});

const frameRateCalculator = new FrameRateCalculator();
let frameRateInterval: NodeJS.Timeout;

function handleButtonClick(buttonClass: string) {
  const [action, value] = buttonClass.split(' ');

  switch (action) {
    case 'skiptime':
      skipTime(parseFloat(value));
      break;
    case 'skipframe':
      skipFrame(parseInt(value));
      break;
    case 'screenshot':
      takeScreenshot();
      break;
    default:
      alert('Unknown action');
  }
}

function skipTime(seconds: number) {
  const video = document.querySelector('video');
  if (video) {
    video.currentTime += seconds;
  }
}

function skipFrame(frames: number) {
  const video = document.querySelector('video');
  if (video) {
    const frameRate = frameRateCalculator.getFrameRate();
    const seconds = frames / frameRate;
    video.currentTime += seconds;
  }
}

function takeScreenshot() {
  const video = document.querySelector('video');
  if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) {
          alert('Failed to create canvas context');
          return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'screenshot.png';
      link.click();
  }
}

function addButtons() {
  // Check if the buttons already exist
  if (document.getElementById('custom-buttons-container'))
    return;

  // Create a container for the buttons
  const container = document.createElement('div');
  container.id = 'custom-buttons-container';
  container.style.position = 'absolute';
  container.style.top = '10px';
  container.style.right = '30px';
  container.style.zIndex = '1000';
  container.style.display = 'flex';
  container.style.gap = '5px';

  // Button configurations
  const buttons = [
      { label: '<<', class: 'skiptime -1' },
      { label: '<', class: 'skiptime -0.1' },
      { label: '<f', class: 'skipframe -1' },
      { label: 'f>', class: 'skipframe 1' },
      { label: '>', class: 'skiptime 0.1' },
      { label: '>>', class: 'skiptime 1' },
      { label: '📷', class: 'screenshot' }
  ];

  // Create and style each button
  buttons.forEach(buttonConfig => {
      const button = document.createElement('button');
      button.innerText = buttonConfig.label;
      button.className = buttonConfig.class;
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.padding = '5px';
      button.style.width = '30px';
      button.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
      button.style.color = '#ffffff';
      button.style.border = 'none';
      button.style.cursor = 'pointer';
      button.style.fontSize = '14px';
      button.style.borderRadius = '3px';
      button.addEventListener('click', () => handleButtonClick(button.className));
      container.appendChild(button);
  });

  // Append the container to the YouTube player
  const player = document.querySelector('.html5-video-player');
  if (player) {
      player.appendChild(container);
  }
}

function createFrameRateDisplay() {
  if (document.getElementById('frame-rate-display')) {
    return;
  }

  const frameRateDisplay = document.createElement('div');
  frameRateDisplay.id = 'frame-rate-display';
  frameRateDisplay.style.padding = '5px';
  frameRateDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
  frameRateDisplay.style.color = '#ffffff';
  frameRateDisplay.style.fontSize = '14px';
  frameRateDisplay.style.borderRadius = '3px';
  frameRateDisplay.innerText = '0FPS';

  const container = document.getElementById('custom-buttons-container');
  if (container) {
      container.insertBefore(frameRateDisplay, container.firstChild);
  }

  frameRateInterval = setInterval(() => {
      const frameRate = frameRateCalculator.getFrameRate().toFixed(2);
      frameRateDisplay.innerText = `${frameRate}FPS`;
  }, 1000);
}

function removeFrameRateDisplay() {
  const frameRateDisplay = document.getElementById('frame-rate-display');
  if (frameRateDisplay) {
      frameRateDisplay.remove();
      clearInterval(frameRateInterval);
  }
}
