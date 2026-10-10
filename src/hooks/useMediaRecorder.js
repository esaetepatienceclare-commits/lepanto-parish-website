import { useCallback, useEffect, useRef, useState } from "react";

// Microphone settings. Auto gain is off because it turns background hiss up
// whenever the speaker pauses; the compressor below evens out the voice instead.
const MIC_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  // Stronger voice-only filtering, used where the browser and device support it.
  voiceIsolation: true,
  autoGainControl: false,
  channelCount: 1,
};

// Cleans up the microphone signal before it is recorded:
// - high-pass removes low rumble and electrical hum (fans, generators, mains)
// - low-pass removes high hiss above the range of the speaking voice
// - compressor keeps loud and soft speech at a similar level
function cleanAudio(rawStream) {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(rawStream);

  const highPass = ctx.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = 100;

  const lowPass = ctx.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = 9000;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -28;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.25;

  const makeUp = ctx.createGain();
  makeUp.gain.value = 1.6;

  const destination = ctx.createMediaStreamDestination();
  source.connect(highPass).connect(lowPass).connect(compressor).connect(makeUp).connect(destination);

  return { ctx, audioTrack: destination.stream.getAudioTracks()[0] };
}

async function listMicrophones() {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((d) => d.kind === "audioinput")
    .map((d, i) => ({ id: d.deviceId, label: d.label || `Microphone ${i + 1}` }));
}

// Records audio or video in the browser and returns the recording as a Blob.
export default function useMediaRecorder(type = "audio") {
  const [recording, setRecording] = useState(false);
  const [mediaBlob, setMediaBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [stream, setStream] = useState(null);
  const [microphones, setMicrophones] = useState([]);
  const [micId, setMicId] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Keep the microphone list current, e.g. when a headset is plugged in.
  useEffect(() => {
    const refresh = () => listMicrophones().then(setMicrophones).catch(() => {});
    refresh();
    navigator.mediaDevices?.addEventListener?.("devicechange", refresh);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refresh);
  }, []);

  const start = useCallback(async () => {
    try {
      const audio = micId ? { ...MIC_CONSTRAINTS, deviceId: { exact: micId } } : MIC_CONSTRAINTS;
      const constraints =
        type === "video"
          ? {
              audio,
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
              },
            }
          : { audio };

      const rawStream = await navigator.mediaDevices.getUserMedia(constraints);
      // Device names are only visible once permission has been given.
      listMicrophones().then(setMicrophones).catch(() => {});

      const { ctx, audioTrack } = cleanAudio(rawStream);
      const recordStream = new MediaStream([audioTrack, ...rawStream.getVideoTracks()]);

      setStream(rawStream);
      chunksRef.current = [];

      let mimeType;
      if (type === "video") {
        mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm";
      } else {
        mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
      }

      const options =
        type === "video"
          ? {
              mimeType,
              videoBitsPerSecond: 2500000,
              audioBitsPerSecond: 128000,
            }
          : {
              mimeType,
              audioBitsPerSecond: 128000,
            };

      const recorder = new MediaRecorder(recordStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setMediaBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        rawStream.getTracks().forEach((t) => t.stop());
        recordStream.getTracks().forEach((t) => t.stop());
        ctx.close();
        setStream(null);
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      alert(`Could not access ${type === "video" ? "the camera" : "the microphone"}. Please allow permission.`);
    }
  }, [type, micId]);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const discard = useCallback(() => {
    setMediaBlob(null);
    setPreviewUrl("");
  }, []);

  return {
    recording,
    mediaBlob,
    previewUrl,
    stream,
    start,
    stop,
    discard,
    microphones,
    micId,
    setMicId,
  };
}
