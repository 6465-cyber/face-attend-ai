import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebcam } from '../hooks/useWebcam';
import { attendanceService } from '../services/attendanceService';
import { studentService } from '../services/studentService';
import { Student, RecognitionResult, AttendanceRecord } from '../types';
import { FaceOverlayCanvas } from '../components/FaceOverlayCanvas';
import { ManualAttendanceModal } from '../components/ManualAttendanceModal';
import { sound } from '../utils/audio';
import { formatTime, getStatusColor } from '../utils/formatters';
import confetti from 'canvas-confetti';
import {
  Camera,
  Play,
  Pause,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Volume2,
  VolumeX,
  PlusCircle,
  VideoOff
} from 'lucide-react';

export const LiveScannerPage: React.FC = () => {
  const {
    videoRef,
    isStreaming,
    cameras,
    selectedCameraId,
    startStream,
    stopStream,
    captureFrame,
    switchCamera
  } = useWebcam();

  // Scanning loop states
  const [isScanning, setIsScanning] = useState(true);
  const [threshold, setThreshold] = useState(0.60);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Recognition state
  const [lastResult, setLastResult] = useState<RecognitionResult | null>(null);
  const [recentlyMarked, setRecentlyMarked] = useState<AttendanceRecord[]>([]);
  const [sessionCount, setSessionCount] = useState(0);

  // Cooldown tracker: map of studentId -> timestamp ms to prevent repeated calls
  const cooldownRef = useRef<{ [key: string]: number }>({});
  const isProcessingFrame = useRef<boolean>(false);

  // Manual modal
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Start webcam on mount
  useEffect(() => {
    startStream();
    // Load student list for manual fallback
    studentService.getStudents().then(setStudentsList).catch(console.error);

    return () => {
      stopStream();
    };
  }, [startStream, stopStream]);

  // Core Frame Recognition Loop
  const processFrame = useCallback(async () => {
    if (!isScanning || !isStreaming || isProcessingFrame.current) {
      return;
    }

    const frameBase64 = captureFrame();
    if (!frameBase64) return;

    try {
      isProcessingFrame.current = true;
      const res = await attendanceService.recognizeFace({
        image: frameBase64,
        threshold,
      });

      setLastResult(res);

      if (res.match_found && res.student) {
        const studentIdKey = res.student.id.toString();
        const now = Date.now();
        const lastCooldown = cooldownRef.current[studentIdKey] || 0;

        // 8-second cooldown per student in the same scanning session
        if (now - lastCooldown > 8000) {
          cooldownRef.current[studentIdKey] = now;

          if (res.already_marked) {
            if (soundEnabled) sound.playAlreadyMarkedChime();
          } else {
            if (soundEnabled) sound.playSuccessChime();
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.5, x: 0.4 }
            });
            setSessionCount((prev) => prev + 1);
          }

          if (res.record) {
            setRecentlyMarked((prev) => [
              { ...res.record!, student: res.student },
              ...prev.filter((r) => r.id !== res.record?.id).slice(0, 7),
            ]);
          }
        }
      }
    } catch (err) {
      console.error('Frame recognition error:', err);
    } finally {
      isProcessingFrame.current = false;
    }
  }, [isScanning, isStreaming, captureFrame, threshold, soundEnabled]);

  // Trigger processing interval every 800ms
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(processFrame, 800);
    return () => clearInterval(interval);
  }, [isScanning, processFrame]);

  const handleManualMark = async (payload: {
    student_id: string | number;
    status: string;
    date?: string;
    notes?: string;
  }) => {
    const record = await attendanceService.manualMark(payload);
    const stud = studentsList.find((s) => s.id === record.student_id);
    if (soundEnabled) sound.playSuccessChime();
    setSessionCount((prev) => prev + 1);
    setRecentlyMarked((prev) => [
      { ...record, student: stud },
      ...prev.slice(0, 7),
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Scanner Telemetry Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Live Biometric Attendance Scanner
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                isScanning && isStreaming
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  isScanning && isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              {isScanning && isStreaming ? 'RECOGNIZING ACTIVE' : 'SCANNER PAUSED'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time biometric video feed. Detected faces are matched and marked in the database automatically.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                : 'bg-[#11162b] border-[#1f294d] text-slate-500'
            }`}
            title={soundEnabled ? 'Audio Chime Enabled' : 'Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Pause / Resume Scanner */}
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isScanning
                ? 'bg-amber-600/20 border border-amber-500 text-amber-300 hover:bg-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {isScanning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Scanner</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Scanner</span>
              </>
            )}
          </button>

          {/* Manual Entry Fallback Button */}
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#11162b] border border-[#1f294d] hover:border-indigo-500 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Manual Mark</span>
          </button>
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Webcam Viewport with Interactive Reticle */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-3xl bg-[#11162b] border border-[#1f294d] overflow-hidden shadow-2xl relative">
            {/* Viewport Top HUD Bar */}
            <div className="px-5 py-3 border-b border-[#1f294d] bg-[#0b1022] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-300 font-semibold">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Live Feed</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-[11px] text-slate-400">
                  Threshold: {Math.round(threshold * 100)}%
                </span>
              </div>

              {/* Camera Switcher Dropdown */}
              {cameras.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedCameraId}
                    onChange={(e) => switchCamera(e.target.value)}
                    className="bg-[#0a0d18] border border-[#1f294d] text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
                  >
                    {cameras.map((c) => (
                      <option key={c.deviceId} value={c.deviceId}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Video Feed Canvas & Overlay */}
            <div className="relative aspect-video bg-[#070a14] flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* High-Tech Bounding Box and Reticle Overlay */}
              <FaceOverlayCanvas
                videoRef={videoRef}
                result={lastResult}
                isScanning={isScanning && isStreaming}
              />

              {/* Offline Overlay if Camera Inactive */}
              {!isStreaming && (
                <div className="absolute inset-0 bg-[#070a14]/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
                  <div className="p-4 rounded-2xl bg-slate-800/60 text-slate-400">
                    <VideoOff className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Camera Connection Inactive</h3>
                  <button
                    onClick={() => startStream()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    Start Camera Stream
                  </button>
                </div>
              )}
            </div>

            {/* Bottom HUD Telemetry Strip */}
            <div className="p-4 bg-[#0b1022] border-t border-[#1f294d] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Dynamic Recognition Status Alert */}
              <div className="flex items-center space-x-3">
                {lastResult?.match_found && lastResult.student ? (
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-white leading-tight">
                        {lastResult.student.full_name}
                      </p>
                      <p className="text-[11px] text-emerald-400">
                        {lastResult.message} ({lastResult.confidence_percentage})
                      </p>
                    </div>
                  </div>
                ) : lastResult?.detected ? (
                  <div className="flex items-center space-x-2 text-xs text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Unregistered face in view or confidence below {Math.round(threshold * 100)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                    <span>Position face towards the camera to register check-in...</span>
                  </div>
                )}
              </div>

              {/* Sensitivity Threshold Slider */}
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="text-[11px]">Threshold:</span>
                <input
                  type="range"
                  min="0.45"
                  max="0.80"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-24 accent-indigo-500"
                />
                <span className="font-mono text-white text-[11px]">
                  {Math.round(threshold * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Session Activity Feed & Session Counters */}
        <div className="lg:col-span-4 space-y-4">
          {/* Session Metrics Card */}
          <div className="rounded-2xl bg-[#11162b] border border-[#1f294d] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Session Attendance Marked
                </p>
                <div className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
                  {sessionCount}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Students automatically marked present during this scanner session.
            </p>
          </div>

          {/* Live Recent Check-in Feed */}
          <div className="rounded-3xl bg-[#11162b] border border-[#1f294d] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Live Scanner Feed</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Auto-Updating
              </span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {recentlyMarked.length > 0 ? (
                recentlyMarked.map((item, idx) => {
                  const statusStyle = getStatusColor(item.status);
                  return (
                    <div
                      key={`${item.id}-${idx}`}
                      className="p-3 rounded-2xl bg-[#0a0d18] border border-[#1f294d] hover:border-indigo-500/40 transition-all flex items-center justify-between animate-in fade-in slide-in-from-top-2"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-white text-xs uppercase">
                          {item.student?.first_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">
                            {item.student?.full_name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {item.student?.student_id} • {item.student?.department}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle.badge}`}
                        >
                          {item.status}
                        </span>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">
                          {formatTime(item.time_in)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">No students marked yet in this live session.</p>
                  <p className="text-[11px] text-slate-600">
                    Stand in front of the camera to test facial recognition!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        students={studentsList}
        onRecord={handleManualMark}
      />
    </div>
  );
};
