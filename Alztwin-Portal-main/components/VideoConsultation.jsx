import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Maximize2,
  Minimize2,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";
import {
  createConsultationSession,
  updateConsultationStatus,
  sendSignalingData,
  getSignalingData,
} from "../services/userService";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const VideoConsultation = ({ user, patient, onClose, onEndCall }) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callStatus, setCallStatus] = useState("initializing"); // initializing, connecting, connected, ended
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Initialize call
  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  // Duration timer
  useEffect(() => {
    if (callStatus === "connected") {
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create consultation session
      const newSession = await createConsultationSession(
        user.uid,
        patient.id,
        null
      );
      setSession(newSession);
      setCallStatus("connecting");

      // Initialize WebRTC
      await initializeWebRTC(newSession);

      // Start polling for signals
      startSignalPolling(newSession.id);
    } catch (err) {
      console.error("Error initializing call:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Camera/microphone access denied. Please allow access and try again."
          : "Failed to initialize video call. Please try again."
      );
      setCallStatus("ended");
    }
  };

  const initializeWebRTC = async (sessionData) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local stream tracks
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    // Handle incoming tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus("connected");
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await sendSignalingData(
          sessionData.id,
          "ice-candidate",
          event.candidate,
          user.uid
        );
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        setCallStatus("ended");
      }
    };

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sendSignalingData(sessionData.id, "offer", offer, user.uid);
  };

  const startSignalPolling = (sessionId) => {
    pollingIntervalRef.current = setInterval(async () => {
      const signals = await getSignalingData(sessionId, user.uid);

      for (const signal of signals) {
        if (signal.type === "offer" && peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal.data)
          );
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          await sendSignalingData(sessionId, "answer", answer, user.uid);
        } else if (signal.type === "answer" && peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal.data)
          );
        } else if (
          signal.type === "ice-candidate" &&
          peerConnectionRef.current
        ) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(signal.data)
          );
        }
      }
    }, 1000);
  };

  const cleanup = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const handleEndCall = async () => {
    if (session) {
      await updateConsultationStatus(session.id, "ended");
    }
    cleanup();
    setCallStatus("ended");
    onEndCall?.();
    onClose?.();
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`fixed inset-0 bg-slate-950 z-50 flex flex-col ${
        isFullscreen ? "" : "p-4"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-sm rounded-t-xl border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {patient?.name?.charAt(0) || "P"}
            </div>
            <div>
              <h3 className="text-white font-semibold">
                Consultation with {patient?.name || "Patient"}
              </h3>
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    callStatus === "connected"
                      ? "bg-green-400"
                      : callStatus === "connecting"
                      ? "bg-yellow-400 animate-pulse"
                      : "bg-red-400"
                  }`}
                />
                <span className="text-sm text-slate-400 capitalize">
                  {callStatus === "connected"
                    ? `Connected • ${formatDuration(duration)}`
                    : callStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-slate-900 rounded-b-xl overflow-hidden">
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Placeholder when no remote video */}
        {callStatus !== "connected" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl font-bold text-white">
                  {patient?.name?.charAt(0) || "P"}
                </span>
              </div>
              <h3 className="text-xl text-white font-semibold mb-2">
                {patient?.name || "Patient"}
              </h3>
              {callStatus === "initializing" && (
                <p className="text-slate-400">Initializing camera...</p>
              )}
              {callStatus === "connecting" && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                  <span className="text-slate-400 ml-2">
                    Waiting for participant...
                  </span>
                </div>
              )}
              {error && <p className="text-red-400 mt-4">{error}</p>}
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-24 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isVideoOn && (
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <VideoOff size={32} className="text-slate-500" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-900/80 rounded text-xs text-white">
            You
          </div>
        </div>

        {/* Control Bar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-slate-900/90 backdrop-blur-sm rounded-full px-6 py-3 border border-slate-700">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioOn
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
            title={isAudioOn ? "Mute" : "Unmute"}
          >
            {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoOn
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
            title={isVideoOn ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            onClick={handleEndCall}
            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            title="End call"
          >
            <PhoneOff size={20} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoConsultation;
