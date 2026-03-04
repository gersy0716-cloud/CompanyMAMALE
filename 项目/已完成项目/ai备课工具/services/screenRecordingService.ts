/**
 * 屏幕录制服务
 * 使用浏览器原生 getDisplayMedia() + MediaRecorder + Web Audio API 实现
 */

export interface AudioCaptureContext {
  audioContext: AudioContext;
  audioDestination: MediaStreamAudioDestinationNode;
}

export interface RecordingContext {
  mediaRecorder: MediaRecorder;
  displayStream: MediaStream;
  audioContext: AudioContext;
  chunks: Blob[];
}

/**
 * 初始化音频捕获上下文
 * 创建 AudioContext 和 MediaStreamAudioDestinationNode
 */
export function initAudioCapture(): AudioCaptureContext {
  const audioContext = new AudioContext();
  const audioDestination = audioContext.createMediaStreamDestination();
  return { audioContext, audioDestination };
}

/**
 * 将 Audio 元素路由到 AudioContext
 * 同时连接 destination 保证扬声器有声音，并连接 audioDestination 用于录制
 */
export function routeAudioThroughContext(
  audioElement: HTMLAudioElement,
  audioContext: AudioContext,
  audioDestination: MediaStreamAudioDestinationNode
): MediaElementAudioSourceNode {
  const source = audioContext.createMediaElementSource(audioElement);
  // 连接到扬声器（用户可以听到）
  source.connect(audioContext.destination);
  // 连接到录制流
  source.connect(audioDestination);
  return source;
}

/**
 * 将 Video 元素路由到 AudioContext
 * 同时连接 destination 保证扬声器有声音，并连接 audioDestination 用于录制
 */
export function routeVideoThroughContext(
  videoElement: HTMLVideoElement,
  audioContext: AudioContext,
  audioDestination: MediaStreamAudioDestinationNode
): MediaElementAudioSourceNode {
  const source = audioContext.createMediaElementSource(videoElement);
  // 连接到扬声器（用户可以听到）
  source.connect(audioContext.destination);
  // 连接到录制流
  source.connect(audioDestination);
  return source;
}

/**
 * 请求屏幕共享权限（应在用户手势中调用）
 * 返回 MediaStream 或 null（用户取消）
 */
export async function requestDisplayStream(): Promise<MediaStream | null> {
  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'monitor',
        frameRate: 30,
      },
      audio: false, // 不使用系统音频，我们用 Web Audio API 捕获
    });
    console.log('✅ 用户已授权屏幕共享');
    return displayStream;
  } catch (error) {
    console.warn('⚠️ 用户取消了屏幕共享:', error);
    return null;
  }
}

/**
 * 开始屏幕录制
 * 使用已授权的 displayStream，与 audioDestination 的音频轨道合并
 */
export function startScreenRecording(
  displayStream: MediaStream,
  audioDestination: MediaStreamAudioDestinationNode
): RecordingContext {
  // 合并视频轨道和音频轨道
  const videoTrack = displayStream.getVideoTracks()[0];
  const audioTrack = audioDestination.stream.getAudioTracks()[0];

  const combinedStream = new MediaStream();
  combinedStream.addTrack(videoTrack);
  if (audioTrack) {
    combinedStream.addTrack(audioTrack);
  }

  // 创建 MediaRecorder
  const chunks: Blob[] = [];
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
    ? 'video/webm;codecs=vp8,opus'
    : 'video/webm';

  const mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 5000000, // 5 Mbps
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  // 开始录制
  mediaRecorder.start(1000); // 每秒收集一次数据

  console.log('🎬 屏幕录制已开始');

  return {
    mediaRecorder,
    displayStream,
    audioContext: audioDestination.context as AudioContext,
    chunks,
  };
}

/**
 * 停止屏幕录制并返回录制的 Blob
 */
export function stopScreenRecording(
  recordingContext: RecordingContext
): Promise<Blob> {
  return new Promise((resolve) => {
    const { mediaRecorder, displayStream, chunks } = recordingContext;

    mediaRecorder.onstop = () => {
      // 停止所有轨道
      displayStream.getTracks().forEach((track) => track.stop());

      // 组装 Blob
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      console.log('🎬 屏幕录制已停止，文件大小:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
      resolve(blob);
    };

    // 如果录制器正在录制，停止它
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    } else {
      // 如果已经停止，直接组装
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' });
      resolve(blob);
    }
  });
}

/**
 * 触发浏览器下载录制的视频文件
 */
export function downloadRecording(blob: Blob, filename?: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `演示录制_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('📥 录制文件已下载:', a.download);
}
