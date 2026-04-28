import { snapshotShowFps, snapshotPosition, snapShotMiniMode } from "@/utils/storage";
import { FrameRateCalculator } from "@/utils/frame-rate-calculator";

// フレームレート計算クラスのインスタンス
const frameRateCalculator = new FrameRateCalculator();
// FPS表示更新用のインターバルID
let frameRateInterval: NodeJS.Timeout;

// ---- A-B ループ状態 ----
// A・B ポイント（未設定は null）
let loopPointA: number | null = null;
let loopPointB: number | null = null;
// ループ中フラグ
let isLooping = false;
// ループによるシークを手動シークと区別するためのフラグ
let isLoopingSeeking = false;
// A・B・ループボタンの参照（状態更新に使用）
let buttonA: HTMLButtonElement | null = null;
let buttonB: HTMLButtonElement | null = null;
let buttonLoop: HTMLButtonElement | null = null;
// 動画イベントリスナーの参照（クリーンアップに使用）
let timeupdateHandler: (() => void) | null = null;
let seekedHandler: (() => void) | null = null;
// SPA 遷移検知用
let lastUrl = location.href;

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

// Youtube のコンテンツ UI がマウントされた際に呼び出される
function handleUiMount() {
  // MutationObserver オブジェクトを作成し、handleMutations 関数をコールバックとして指定
  const observer = new MutationObserver(handleMutations);
  // document.body の子要素の追加・削除および全ての子孫要素の変更を監視し、ボタンコンテナを配置する
  observer.observe(document.body, { childList: true, subtree: true });

  // ミニモード設定の変更を監視し、ミニモードのON/OFFを切り替える
  snapShotMiniMode.watch(async (miniMode) => { toggleButtonsContainer(miniMode); });
  // FPS表示設定の変更を監視し、FPS表示のON/OFFを切り替える
  snapshotShowFps.watch(async (showFps) => { toggleFrameRateDisplay(showFps); });
  // ボタン位置設定の変更を監視し、ボタン位置を変更する
  snapshotPosition.watch(async (position) => { changeButtonPosition(position); });
}

// DOM の変更を監視して処理を実行する
async function handleMutations() {
  // SPA 遷移（URL 変化）を検知してループ状態をリセットする
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    resetLoopState();
  }
  // ミニモード設定に応じてボタンコンテナを初期表示する
  initializeButtonsContainer(await snapShotMiniMode.getValue());
  // FPS表示設定に応じてFPSを表示する
  toggleFrameRateDisplay(await snapshotShowFps.getValue());
  // ボタン位置設定に応じてボタン位置を変更する
  changeButtonPosition(await snapshotPosition.getValue());
}

// ボタンコンテナを初期表示する
function initializeButtonsContainer(miniMode: boolean) {
  // 既存のボタンコンテナが存在する場合は何もしない
  if (document.getElementById('custom-buttons-container')) {
    return;
  }
  // ボタンコンテナを作成
  addButtonsContainer(miniMode);
}

// ボタンコンテナのモードを切り替える
function toggleButtonsContainer(miniMode: boolean) {
  // ミニモード切り替え時にループ状態をリセットする（③）
  resetLoopState();
  // 既存のボタンコンテナを削除
  const existingContainer = document.getElementById('custom-buttons-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  // ボタンコンテナを作成
  addButtonsContainer(miniMode);
}

// Youtube 動画上にボタンを追加
function addButtonsContainer(miniMode: boolean) {
  // ボタンを配置するコンテナを作成
  const container = document.createElement('div');
  container.id = 'custom-buttons-container';
  Object.assign(container.style, {
    position: 'absolute',
    top: '10px',
    right: '30px',
    zIndex: '1000',
    display: 'flex',
    gap: '5px',
    alignItems: 'center'
  });

  // ボタンのベーススタイルを定義
  const buttonStyle: Partial<CSSStyleDeclaration> = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 5px',
    minWidth: '30px',
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '3px'
  };

  // A・B・ループボタン用の追加スタイル（時間の縦並び表示に使用）
  const abButtonStyle: Partial<CSSStyleDeclaration> = {
    ...buttonStyle,
    flexDirection: 'column',
    lineHeight: '1.2'
  };

  if (!miniMode) {
    // A ボタン
    buttonA = document.createElement('button');
    Object.assign(buttonA.style, abButtonStyle);
    updateAbButtonLabel(buttonA, 'A', loopPointA);
    buttonA.addEventListener('click', () => handleLoopPointClick('A'));
    container.appendChild(buttonA);

    // B ボタン
    buttonB = document.createElement('button');
    Object.assign(buttonB.style, abButtonStyle);
    updateAbButtonLabel(buttonB, 'B', loopPointB);
    buttonB.addEventListener('click', () => handleLoopPointClick('B'));
    container.appendChild(buttonB);

    // ループボタン
    buttonLoop = document.createElement('button');
    Object.assign(buttonLoop.style, abButtonStyle);
    buttonLoop.innerText = '🔁';
    buttonLoop.disabled = true;
    Object.assign(buttonLoop.style, {
      opacity: '0.4',
      cursor: 'not-allowed'
    });
    buttonLoop.addEventListener('click', () => {
      if (isLooping) {
        stopLoop();
      } else {
        startLoop();
      }
    });
    container.appendChild(buttonLoop);
  }

  // 配置するボタンの定義（スキップ・スクリーンショット）
  const buttons = miniMode
    ? [
        { label: '📷', class: 'screenshot' }
      ] : [
        { label: '-1', class: 'skiptime -1' },
        { label: '-.1', class: 'skiptime -0.1' },
        { label: '-f', class: 'skipframe -1' },
        { label: '+f', class: 'skipframe 1' },
        { label: '+.1', class: 'skiptime 0.1' },
        { label: '+1', class: 'skiptime 1' },
        { label: '📷', class: 'screenshot' }
      ];

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

  // 動画イベントリスナーを設定する（②）
  const video = document.querySelector('video');
  if (video) {
    setupLoopListeners(video);
  }
}

// ボタン群の位置を変更
function changeButtonPosition(position: string) {
  const container = document.getElementById('custom-buttons-container');
  if (!container) return;

  switch (position) {
    case 'top-left':
      Object.assign(container.style, {
        top: '10px',
        right: 'auto',
        left: '30px'
      });
      break;
    case 'top-right':
      Object.assign(container.style, {
        top: '10px',
        right: '30px',
        left: 'auto'
      });
      break;
    case 'bottom-left':
      Object.assign(container.style, {
        top: 'auto',
        right: 'auto',
        bottom: '10px',
        left: '30px'
      });
      break;
    case 'bottom-right':
      Object.assign(container.style, {
        top: 'auto',
        right: '30px',
        bottom: '10px',
        left: 'auto'
      });
      break;
    default:
      break;
  }
}

// FPS表示/非表示を切り替える
function toggleFrameRateDisplay(showFps: boolean) {
  if (showFps) {
    createFrameRateDisplay();
  } else {
    removeFrameRateDisplay();
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
    // FPS表示を更新するためのインターバルを停止
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

// ---- A-B ループ機能 ----

// 秒数を M:SS または H:MM:SS 形式にフォーマットする
function formatLoopTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// A・B ボタンのラベルを更新する（時間が設定済みの場合は縮小表示）
function updateAbButtonLabel(
  button: HTMLButtonElement,
  label: string,
  time: number | null
) {
  // 既存の子要素をクリア
  button.replaceChildren();
  const span = document.createElement('span');
  span.innerText = label;
  button.appendChild(span);
  if (time !== null) {
    const small = document.createElement('small');
    small.innerText = formatLoopTime(time);
    Object.assign(small.style, {
      fontSize: '9px',
      display: 'block',
      lineHeight: '1'
    });
    button.appendChild(small);
  }
}

// ループボタンの有効・無効状態を更新する
function updateLoopButtonState() {
  if (!buttonLoop) return;
  const canLoop =
    loopPointA !== null &&
    loopPointB !== null &&
    loopPointA < loopPointB;
  buttonLoop.disabled = !canLoop;
  Object.assign(buttonLoop.style, {
    opacity: canLoop ? '1' : '0.4',
    cursor: canLoop ? 'pointer' : 'not-allowed'
  });
}

// A または B ポイントをクリック時に登録する
function handleLoopPointClick(point: 'A' | 'B') {
  const video = document.querySelector('video');
  if (!video) return;
  const time = video.currentTime;
  if (point === 'A') {
    loopPointA = time;
    if (buttonA) updateAbButtonLabel(buttonA, 'A', loopPointA);
  } else {
    loopPointB = time;
    if (buttonB) updateAbButtonLabel(buttonB, 'B', loopPointB);
  }
  updateLoopButtonState();
  // ループ中に A > B になった場合はループを停止する（④）
  if (
    isLooping &&
    loopPointA !== null &&
    loopPointB !== null &&
    loopPointA >= loopPointB
  ) {
    stopLoop();
  }
}

// ループを開始する
function startLoop() {
  isLooping = true;
  if (buttonLoop) {
    Object.assign(buttonLoop.style, {
      backgroundColor: 'rgba(0, 180, 0, 0.8)',
      opacity: '1'
    });
  }
}

// ループを停止する
function stopLoop() {
  isLooping = false;
  if (buttonLoop) {
    Object.assign(buttonLoop.style, {
      backgroundColor: 'rgba(255, 0, 0, 0.6)'
    });
    updateLoopButtonState();
  }
}

// 動画の timeupdate・seeked イベントリスナーを設定する（②）
function setupLoopListeners(video: HTMLVideoElement) {
  // 既存のリスナーを先に削除する
  removeLoopListeners(video);

  // timeupdate: B ポイントを超えたら A ポイントへ戻す
  timeupdateHandler = () => {
    if (!isLooping || loopPointA === null || loopPointB === null) return;
    if (video.currentTime >= loopPointB) {
      isLoopingSeeking = true; // ループによるシークを手動シークと区別する（①）
      video.currentTime = loopPointA;
    }
  };

  // seeked: 手動シークによるループ停止（①）
  seekedHandler = () => {
    if (isLoopingSeeking) {
      isLoopingSeeking = false; // ループ由来のシークなので無視する
      return;
    }
    if (isLooping) {
      stopLoop();
    }
  };

  video.addEventListener('timeupdate', timeupdateHandler);
  video.addEventListener('seeked', seekedHandler);
}

// 動画イベントリスナーを削除する（②）
function removeLoopListeners(video: HTMLVideoElement) {
  if (timeupdateHandler) {
    video.removeEventListener('timeupdate', timeupdateHandler);
    timeupdateHandler = null;
  }
  if (seekedHandler) {
    video.removeEventListener('seeked', seekedHandler);
    seekedHandler = null;
  }
}

// ループ状態をすべてリセットする（③⑥）
function resetLoopState() {
  const video = document.querySelector('video');
  if (video) {
    removeLoopListeners(video);
  }
  loopPointA = null;
  loopPointB = null;
  isLooping = false;
  isLoopingSeeking = false;
  buttonA = null;
  buttonB = null;
  buttonLoop = null;
}
