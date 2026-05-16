import { LIVE_MIRROR, LIVE_VTON_PROMPT } from "../services/decartRealtime";

/** Inline page for WebView — Decart WebRTC (same stack as website TryOnStudio live mode). */
export function buildLiveTryOnHtml() {
  const prompt = JSON.stringify(LIVE_VTON_PROMPT);
  const mirror = JSON.stringify(LIVE_MIRROR);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #0a0612; color: #e2e8f0; font-family: system-ui, sans-serif; }
    #root { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100%; padding: 8px; gap: 8px; }
    video { width: 100%; max-height: 72vh; border-radius: 12px; background: #000; object-fit: contain; }
    #status { font-size: 12px; text-align: center; color: #94a3b8; padding: 0 8px; }
    #error { font-size: 12px; color: #f87171; text-align: center; display: none; padding: 0 8px; }
  </style>
</head>
<body>
  <div id="root">
    <video id="feed" playsinline muted autoplay></video>
    <p id="status">Waiting to connect…</p>
    <p id="error"></p>
  </div>
  <script type="module">
    const DEFAULT_PROMPT = ${prompt};
    const LIVE_MIRROR = ${mirror};

    const video = document.getElementById("feed");
    const statusEl = document.getElementById("status");
    const errorEl = document.getElementById("error");

    let session = { stream: null, rtc: null, startedAt: 0, genSeconds: 0 };
    let createDecartClient;
    let models;

    const post = (payload) => {
      if (window.ReactNativeWebView?.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    };

    const setStatus = (t) => {
      statusEl.textContent = t;
      post({ type: "status", message: t });
    };
    const setError = (t) => {
      errorEl.style.display = t ? "block" : "none";
      errorEl.textContent = t || "";
    };

    const dataUrlToFile = async (dataUrl, name) => {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return new File([blob], name || "garment.jpg", { type: blob.type || "image/jpeg" });
    };

    const stopSession = (emitEnd) => {
      try { session.rtc?.disconnect?.(); } catch {}
      session.rtc = null;
      if (session.stream) {
        session.stream.getTracks().forEach((t) => t.stop());
        session.stream = null;
      }
      video.srcObject = null;
      if (emitEnd) {
        const wallSeconds = session.startedAt
          ? Math.max(0, Math.round((Date.now() - session.startedAt) / 1000))
          : 0;
        post({
          type: "sessionEnd",
          generationSeconds: session.genSeconds,
          wallSeconds,
        });
      }
      session.startedAt = 0;
      session.genSeconds = 0;
    };

    const connect = async ({ apiKey, modelId, garmentDataUrl, prompt }) => {
      try {
      stopSession(false);
      setError("");
      setStatus("Opening camera…");

      const model = models.realtime(modelId || "lucy-vton-2");
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "user" },
            frameRate: { ideal: model.fps, max: 30 },
            width: { ideal: model.width, min: 320, max: 1920 },
            height: { ideal: model.height, min: 240, max: 1080 },
          },
        });
      } catch (err) {
        const name = err?.name || "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          throw new Error("Camera permission was denied. Allow camera access and try again.");
        }
        if (name === "NotFoundError") {
          throw new Error("No camera was found on this device.");
        }
        throw err;
      }

      session.stream = stream;
      video.srcObject = stream;
      await video.play().catch(() => {});

      setStatus("Connecting to live try-on…");
      const garmentFile = await dataUrlToFile(garmentDataUrl, "garment.jpg");
      const client = createDecartClient({ apiKey });
      const mirror =
        LIVE_MIRROR === "true" ? true : LIVE_MIRROR === "false" ? false : "auto";

      const rtc = await client.realtime.connect(stream, {
        model,
        mirror,
        onRemoteStream: (edited) => {
          video.srcObject = edited;
          video.play().catch(() => {});
        },
      });

      await rtc.set({
        prompt: prompt || DEFAULT_PROMPT,
        enhance: true,
        image: garmentFile,
      });

      session.rtc = rtc;
      session.startedAt = Date.now();
      session.genSeconds = 0;

      rtc.on?.("generationTick", ({ seconds }) => {
        session.genSeconds = Math.max(session.genSeconds, Number(seconds) || 0);
        post({ type: "tick", totalSeconds: session.genSeconds });
      });

      rtc.on?.("error", (e) => {
        post({ type: "error", message: String(e?.message || e || "Live session error") });
      });

      setStatus("Live try-on active");
      post({ type: "connected" });
      } catch (err) {
        stopSession(false);
        const msg = err?.message || String(err || "Could not start live try-on");
        setError(msg);
        post({ type: "error", message: msg });
      }
    };

    const captureFrame = () => {
      if (!video.videoWidth || !video.videoHeight) {
        post({ type: "error", message: "Camera is not ready yet." });
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        post({ type: "error", message: "Could not capture frame." });
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      post({ type: "capture", dataUrl });
    };

    try {
      const sdk = await import("https://esm.sh/@decartai/sdk@0.0.67");
      createDecartClient = sdk.createDecartClient;
      models = sdk.models;
      window.__liveTryOn = { connect, disconnect: () => stopSession(true), captureFrame };
      post({ type: "ready" });
    } catch (err) {
      const msg = "Could not load live try-on engine. Check your internet connection.";
      setError(msg);
      post({ type: "error", message: msg + " " + (err?.message || "") });
    }
  </script>
</body>
</html>`;
}
