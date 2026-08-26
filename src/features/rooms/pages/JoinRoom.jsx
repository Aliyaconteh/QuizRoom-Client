import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import jsQR from "jsqr";
import { QrCode, X, Camera, CameraOff } from "lucide-react";

import { socket } from "../../../services/socket/socket";
import { useRoom } from "../../../context/RoomContext";
import { useToast } from "../../../components/ui/ToastContext";

// ── segmented 6-slot room code input ─────────────────────────────────────────
function RoomCodeInput({ value, onChange }) {
  const SLOTS = 6;
  const refs  = useRef([]);
  const chars = Array.from({ length: SLOTS }, (_, i) => value.toUpperCase()[i] || "");

  const handleChange = (e, i) => {
    const nextChar = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-1);
    onChange(chars.map((c, idx) => (idx === i ? nextChar : c)).join(""));
    if (nextChar && i < SLOTS - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (e, i) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      onChange(chars.map((c, idx) => (idx === i ? "" : c)).join(""));
      if (i > 0) refs.current[i - 1]?.focus();
      return;
    }
    if (e.key === "ArrowLeft")  { refs.current[i - 1]?.focus(); return; }
    if (e.key === "ArrowRight") { refs.current[i + 1]?.focus(); return; }
    if (/^[a-zA-Z0-9]$/.test(e.key)) {
      e.preventDefault();
      onChange(chars.map((c, idx) => (idx === i ? e.key.toUpperCase() : c)).join(""));
      if (i < SLOTS - 1) refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text")
      .replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, SLOTS);
    onChange(pasted);
    refs.current[Math.min(pasted.length, SLOTS - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {chars.map((ch, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="text"
          maxLength={1}
          value={ch}
          aria-label={`Room code character ${i + 1}`}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          onChange={(e) => handleChange(e, i)}
          onFocus={(e) => e.target.select()}
          className={`
            w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-[1.5px] bg-[#0f1720]
            text-lg sm:text-xl font-bold text-center uppercase outline-none caret-transparent
            transition-all duration-150
            focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-emerald-500/[0.06]
            ${ch ? "border-emerald-500/40 text-emerald-400" : "border-slate-700/50 text-slate-100"}
          `}
        />
      ))}
    </div>
  );
}

// ── QR Scanner component using camera + jsQR ─────────────────────────────────
function QRScanner({ onScan, onClose }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  // Extract roomCode from a URL like /join-room?roomCode=ABC123 or plain ABC123
  const extractCode = (raw) => {
    try {
      const url = new URL(raw);
      const param = url.searchParams.get("roomCode");
      if (param) return param.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    } catch {
      // not a URL — treat as raw code
    }
    return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  };

  const tick = useCallback(function scanFrame() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.height = video.videoHeight;
    canvas.width  = video.videoWidth;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    if (code) {
      const extracted = extractCode(code.data);
      if (extracted.length === 6) {
        onScan(extracted);
        return; // stop scanning
      }
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [onScan]);

  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
          rafRef.current = requestAnimationFrame(tick);
        }
      } catch (err) {
        if (active) setError(
          err.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access and try again."
            : "Could not access camera. Make sure no other app is using it."
        );
      }
    };

    startCamera();

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [tick]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-[#0d131c] border border-emerald-500/20 rounded-3xl overflow-hidden shadow-2xl"
           style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-emerald-400" />
            <span className="font-bold text-white text-sm">Scan QR Code</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close scanner"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="relative bg-black aspect-square">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            aria-label="Camera feed for QR scanning"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Targeting reticle */}
          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-52 h-52 relative">
                {/* Corner brackets */}
                <span className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-lg" />
                {/* Scan line */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent top-1/2 opacity-80"
                     style={{ animation: "scanLine 2s ease-in-out infinite" }} />
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center">
              <CameraOff size={32} className="text-red-400 mb-3" />
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Loading overlay */}
          {!scanning && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-3" />
              <p className="text-slate-400 text-xs">Starting camera…</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 text-center">
          <p className="text-xs text-slate-500">
            Point your camera at the host's QR code to auto-fill the room code
          </p>
        </div>
      </div>

      {/* Scan line keyframe */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-40px); opacity: 0.4; }
          50%       { transform: translateY(40px);  opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function JoinRoom() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const { setRoom }     = useRoom();
  const { addToast }    = useToast();

  const [roomCode,    setRoomCode]    = useState((searchParams.get("roomCode") || "").toUpperCase());
  const [username,    setUsername]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const canSubmit = roomCode.length === 6 && username.trim().length > 0 && !loading;

  const handleJoinRoom = () => {
    if (roomCode.length < 6) { addToast("Enter a 6-character room code", { type: "error" }); return; }
    if (!username.trim())    { addToast("Enter your username",           { type: "error" }); return; }

    setLoading(true);
    const playerId = localStorage.getItem("playerId") || `player_${Date.now()}`;
    localStorage.setItem("username", username.trim());
    localStorage.setItem("playerId", playerId);

    socket.connect();
    socket.emit(
      "join-room",
      { roomCode, player: { id: playerId, username: username.trim() } },
      (response) => {
        setLoading(false);
        if (!response.success) { addToast(response.message, { type: "error" }); return; }
        const code = response.room.room_code || response.room.roomCode;
        setRoom({ code, name: response.room.room_name, syncMode: response.room.sync_mode, isHost: false });
        navigate(`/waiting-room/${code}`);
      }
    );
  };

  const handleScan = (code) => {
    setRoomCode(code);
    setShowScanner(false);
    addToast(`Room code "${code}" scanned!`, { type: "success" });
  };

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { left:-60%; } 100% { left:160%; } }
        .btn-shimmer::after {
          content:''; position:absolute; inset-block:0; left:-60%; width:40%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent);
          transform:skewX(-15deg); animation:shimmer 2.8s infinite;
        }
      `}</style>

      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      <div
        className={`min-h-screen bg-[#060a0f] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}
      >
        {/* Dot-grid background */}
        <svg aria-hidden="true" className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none">
          <defs>
            <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#10b981" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Ambient blobs */}
        <div className="absolute w-72 h-72 sm:w-[520px] sm:h-[520px] rounded-full bg-emerald-500/10 blur-[90px] -top-32 -right-36 pointer-events-none" />
        <div className="absolute w-64 h-64 sm:w-[400px] sm:h-[400px] rounded-full bg-blue-500/10 blur-[90px] -bottom-24 -left-20 pointer-events-none" />

        {/* Card */}
        <div className={`relative w-full max-w-sm sm:max-w-[440px] bg-[#0d131c]/90 border border-emerald-500/[0.14] rounded-3xl px-6 py-8 sm:px-8 sm:py-10 shadow-2xl transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
          {/* Top shimmer line */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent rounded-full" />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-[0.12em] uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Live Session
          </div>

          {/* Heading */}
          <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-slate-100 leading-tight mb-1.5">
            Join a{" "}
            <em className="not-italic bg-gradient-to-br from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Room
            </em>
          </h1>
          <p className="text-sm text-slate-500 mb-7 sm:mb-8">
            Enter the 6-character code or scan the host's QR code
          </p>

          {/* Fields */}
          <div className="flex flex-col gap-5">

            {/* Room code + scan button */}
            <div>
              <div className="flex items-center justify-between text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-slate-500 mb-3">
                <span>Room Code</span>
                <div className="flex items-center gap-3">
                  <span className={roomCode.length === 6 ? "text-emerald-400" : ""}>{roomCode.length}/6</span>
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="flex items-center gap-1 text-[0.65rem] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full px-2.5 py-1 hover:bg-sky-500/20 transition-colors"
                    title="Scan QR code"
                  >
                    <Camera size={11} />
                    Scan QR
                  </button>
                </div>
              </div>
              <RoomCodeInput value={roomCode} onChange={setRoomCode} />
            </div>

            {/* Scanned indicator */}
            {roomCode.length === 6 && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 -mt-2 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Code ready — enter your name and join
              </div>
            )}

            {/* Username */}
            <div>
              <div className="text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-slate-500 mb-2">
                Your Name
              </div>
              <input
                type="text"
                placeholder="How should we call you?"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && handleJoinRoom()}
                maxLength={24}
                autoComplete="nickname"
                className="w-full bg-[#0f1720] border-[1.5px] border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 text-[0.9375rem] outline-none placeholder:text-slate-700 transition-all duration-150 focus:border-emerald-500 focus:bg-emerald-500/[0.05] focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleJoinRoom}
              disabled={!canSubmit}
              aria-busy={loading}
              className={`btn-shimmer relative w-full mt-1 py-3.5 rounded-2xl overflow-hidden text-white font-bold text-[0.9375rem] tracking-wide bg-gradient-to-br from-indigo-600 to-violet-600 shadow-[0_4px_20px_rgba(16,185,129,0.28),0_1px_3px_rgba(0,0,0,0.3)] transition-all duration-200 ${canSubmit ? "hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(16,185,129,0.4)] active:translate-y-0 cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining…
                </span>
              ) : (
                "Join Room →"
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2.5 text-[0.7rem] tracking-wide text-slate-700 mt-6">
            <span className="flex-1 h-px bg-slate-800" />
            or ask the host to share a link
            <span className="flex-1 h-px bg-slate-800" />
          </div>

          {/* QR scan hint */}
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-900/60 py-3 text-sm font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 hover:bg-emerald-500/5 transition-all duration-200"
          >
            <QrCode size={16} />
            Scan QR Code Instead
          </button>
        </div>
      </div>
    </>
  );
}
