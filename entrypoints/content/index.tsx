import { snapshotShowFps } from "@/utils/storage";
import { FrameRateCalculator } from "@/utils/frame-rate-calculator";

// フレームレート計算クラスのインスタンスを作成
const frameRateCalculator = new FrameRateCalculator();
// FPS表示更新用のインターバルID
let frameRateInterval: NodeJS.Timeout;

// コンテンツスクリプトのメイン関数
export default defineContentScript({
  // マッチしたURLで拡張機能を有効にする
  matches: ['*://www.youtube.com/*'],
  main(ctx) {
    // 統合されたコンテンツUIを作成してマウントする
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      onMount: handleUiMount,
    });
    ui.mount();
  }
});

// YoutubeのコンテンツUIがマウントされた際に呼び出される
function handleUiMount() {
  // MutationObserverオブジェクトを作成し、handleMutations関数をコールバックとして指定
  const observer = new MutationObserver(handleMutations);
  // document.bodyを監視対象に設定し、子要素の追加・削除および全ての子孫要素の変更を監視
  observer.observe(document.body, { childList: true, subtree: true });
}

// DOMの変更を監視して処理を実行する
async function handleMutations() {
  // Youtube 動画上にボタンを追加
  addButtons();
  // ストレージを確認し、FPS表示ありの場合、FPS表示を追加
  const showFps = await snapshotShowFps.getValue();
  if (showFps) {
    createFrameRateDisplay();
  }
  // ストレージの変更を監視し、FPS表示の追加・削除を切り替える
  snapshotShowFps.watch(async (showFps) => {
    if (showFps) {
      createFrameRateDisplay();
    } else {
      removeFrameRateDisplay();
    }
  });
}

// Youtube 動画上にボタンを追加
function addButtons() {
  if (document.getElementById('custom-buttons-container'))
    return;

  // ボタンを配置するコンテナを作成
  const container = document.createElement('div');
  container.id = 'custom-buttons-container';
  Object.assign(container.style, {
    position: 'absolute',
    top: '10px',
    right: '30px',
    zIndex: '1000',
    display: 'flex',
    gap: '5px'
  });

  // 配置するボタンの定義
  const buttons = [
    { label: '-1', class: 'skiptime -1' },
    { label: '-.1', class: 'skiptime -0.1' },
    { label: '-f', class: 'skipframe -1' },
    { label: '+f', class: 'skipframe 1' },
    { label: '+.1', class: 'skiptime 0.1' },
    { label: '+1', class: 'skiptime 1' },
    { label: '📷', class: 'screenshot' }
  ];

  // ボタンのスタイルを定義
  const buttonStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px',
    width: '30px',
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '3px'
  };

  // ボタンを作成してコンテナに配置
  buttons.forEach(buttonConfig => {
    const button = document.createElement('button');
    button.innerText = buttonConfig.label;
    button.className = buttonConfig.class;
    Object.assign(button.style, buttonStyle);
    button.addEventListener('click', () => handleButtonClick(button.className));
    container.appendChild(button);
  });

  // Youtubeのプレイヤー要素を取得してコンテナを配置
  const player = document.querySelector('.html5-video-player');
  if (player) {
    player.appendChild(container);
  }
}

// FPS表示を作成する
function createFrameRateDisplay() {
  if (document.getElementById('frame-rate-display')) {
    return;
  }

  const frameRateDisplay = document.createElement('div');
  frameRateDisplay.id = 'frame-rate-display';
  Object.assign(frameRateDisplay.style, {
    padding: '5px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#ffffff',
    fontSize: '14px',
    borderRadius: '3px'
  });
  frameRateDisplay.innerText = '0FPS';

  const container = document.getElementById('custom-buttons-container');
  if (container) {
    container.insertBefore(frameRateDisplay, container.firstChild);
  }

  // フレームレート計算を開始
  frameRateCalculator.start();

  // FPS表示を更新するためのインターバルを設定
  frameRateInterval = setInterval(() => {
    const frameRate = frameRateCalculator.getFrameRate().toFixed(2);
    frameRateDisplay.innerText = `${frameRate}FPS`;
  }, 1000);
}

// FPS表示を削除する
function removeFrameRateDisplay() {
  const frameRateDisplay = document.getElementById('frame-rate-display');
  if (frameRateDisplay) {
    frameRateDisplay.remove();
    clearInterval(frameRateInterval);
    // フレームレート計算を停止
    frameRateCalculator.stop();
  }
}

// ボタンクリック時の処理
function handleButtonClick(buttonClass: string) {
  // ボタンのクラス名からアクションと値を取得
  const [action, value] = buttonClass.split(' ');
  // アクションに応じた処理を実行
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

// 動画を指定した秒数分スキップする
function skipTime(seconds: number) {
  const video = document.querySelector('video');
  if (video) {
    video.currentTime += seconds;
  }
}

// 動画を指定したフレーム数分スキップする
function skipFrame(frames: number) {
  const video = document.querySelector('video');
  if (video) {
    const frameRate = frameRateCalculator.getFrameRate();
    const seconds = frames / frameRate;
    video.currentTime += seconds;
  }
}

// 動画のスクリーンショットを撮影する
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
    link.download = `snapshot_${getFormattedDate()}.png`;
    link.click();
  }
}

// 日付をフォーマットして返す
function getFormattedDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const h = now.getHours().toString().padStart(2, '0');
  const mi = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${y}${m}${d}_${h}${mi}${s}_${ms}`;
}
