import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWebcam } from '../hooks/useWebcam';
import { studentService } from '../services/studentService';
import { Student } from '../types';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Camera,
  UserCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  VideoOff,
  Sliders,
  ShieldCheck,
  ChevronRight,
  Trash2
} from 'lucide-react';

export const FaceRegistrationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedId = searchParams.get('student_id');

  const {
    videoRef,
    isStreaming,
    hasPermission,
    cameraError,
    cameras,
    selectedCameraId,
    startStream,
    stopStream,
    captureFrame,
    switchCamera
  } = useWebcam();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedId || '');
  const [capturedSamples, setCapturedSamples] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Fetch student list
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await studentService.getStudents();
        setStudents(data);
        if (preselectedId) {
          setSelectedStudentId(preselectedId);
        } else if (data.length > 0 && !selectedStudentId) {
          setSelectedStudentId(data[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      }
    };
    fetchStudents();
  }, [preselectedId]);

  // Start webcam on mount
  useEffect(() => {
    startStream();
    return () => {
      stopStream();
    };
  }, [startStream, stopStream]);

  const selectedStudent = students.find((s) => s.id.toString() === selectedStudentId);

  // Capture a facial sample frame
  const handleCaptureSample = () => {
    const frame = captureFrame();
    if (!frame) {
      setStatusMessage({ type: 'error', text: 'Failed to capture frame from webcam. Ensure camera is active.' });
      return;
    }

    sound.playCaptureClick();
    const updated = [...capturedSamples, frame];
    setCapturedSamples(updated);

    setStatusMessage({
      type: 'info',
      text: `Captured sample ${updated.length} of 3. (You can enroll now or capture up to 3 samples for best accuracy).`
    });
  };

  const handleRemoveSample = (index: number) => {
    const updated = capturedSamples.filter((_, i) => i !== index);
    setCapturedSamples(updated);
  };

  // Submit biometric enrollment to backend
  const handleEnrollBiometrics = async () => {
    if (!selectedStudent) {
      setStatusMessage({ type: 'error', text: 'Please select a student from the dropdown.' });
      return;
    }
    if (capturedSamples.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please capture at least one facial sample first.' });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(null);

      const res = await studentService.registerFace(selectedStudent.id, {
        image: capturedSamples[0],
        samples: capturedSamples,
      });

      // Play success chime & launch confetti
      sound.playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setStatusMessage({
        type: 'success',
        text: `Success! Biometric vector enrolled for ${res.full_name}. Student is now recognized in Live Scanner!`
      });

      // Update student in local state
      setStudents((prev) =>
        prev.map((s) => (s.id === res.id ? { ...s, is_face_registered: true, photo_url: res.photo_url } : s))
      );
      setCapturedSamples([]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      sound.playErrorBuzz();
      setStatusMessage({
        type: 'error',
        text: e.response?.data?.message || 'Biometric enrollment failed. Please ensure a clear human face is in view.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>Biometric Face Registration Studio</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              128-D Feature Extraction
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Capture high-resolution face profiles and generate normalized biometric embeddings.
          </p>
        </div>

        <button
          onClick={() => navigate('/scanner')}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#11162b] border border-[#1f294d] hover:border-indigo-500 text-slate-300 hover:text-white text-xs font-semibold transition-all"
        >
          <span>Go to Live Scanner</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera Capture Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl bg-[#11162b] border border-[#1f294d] overflow-hidden shadow-2xl relative">
            {/* Camera Viewport Bar */}
            <div className="px-5 py-3 border-b border-[#1f294d] bg-[#0b1022] flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                <Camera className="w-4 h-4 text-purple-400" />
                <span>Webcam Studio Feed</span>
                {isStreaming && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>

              {/* Camera Switcher Dropdown */}
              {cameras.length > 1 && (
                <div className="flex items-center space-x-2 text-xs">
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

            {/* Video Feed */}
            <div className="relative aspect-video bg-[#070a14] flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Centered Face Alignment Framing Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-64 border-2 border-dashed border-purple-500/50 rounded-full flex items-center justify-center">
                  <div className="w-48 h-56 border border-purple-400/30 rounded-full" />
                </div>
                <div className="absolute bottom-6 px-4 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-purple-300 border border-purple-500/30">
                  Align face inside the oval frame
                </div>
              </div>

              {/* Fallback if Camera Permission Denied or Not Active */}
              {!isStreaming && (
                <div className="absolute inset-0 bg-[#070a14]/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-800/60 text-slate-400">
                    <VideoOff className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Camera Access Inactive</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {cameraError || 'Please allow webcam access in browser to enroll facial biometrics.'}
                  </p>
                  <button
                    onClick={() => startStream()}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Initialize Camera</span>
                  </button>
                </div>
              )}
            </div>

            {/* Viewport Control Bar */}
            <div className="p-4 bg-[#0b1022] border-t border-[#1f294d] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Resolution: 640x480 • CLAHE Normalization Active
              </span>
              <button
                type="button"
                disabled={!isStreaming || capturedSamples.length >= 3}
                onClick={handleCaptureSample}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all disabled:opacity-50 hover:scale-[1.02]"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Sample ({capturedSamples.length}/3)</span>
              </button>
            </div>
          </div>

          {/* Captured Sample Previews Carousel */}
          {capturedSamples.length > 0 && (
            <div className="rounded-2xl bg-[#11162b] border border-[#1f294d] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Captured Face Samples ({capturedSamples.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Multiple samples improve lighting and angle tolerance
                </span>
              </div>
              <div className="flex items-center space-x-3 overflow-x-auto pb-1">
                {capturedSamples.map((snap, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <img
                      src={snap}
                      alt={`Sample ${idx + 1}`}
                      className="w-24 h-20 object-cover rounded-xl border border-purple-500/40"
                    />
                    <button
                      onClick={() => handleRemoveSample(idx)}
                      className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      title="Remove sample"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                      Sample #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Student Assignment & Enrollment Action Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl bg-[#11162b] border border-[#1f294d] p-6 space-y-5 shadow-2xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Select Student Candidate</span>
                <UserCheck className="w-4 h-4 text-purple-400" />
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign the captured biometric embedding to an academic student record.
              </p>
            </div>

            {/* Status Alert Banner */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 animate-in fade-in ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : statusMessage.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Student Dropdown Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Choose Student Record
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setStatusMessage(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="" disabled>
                  -- Select a student --
                </option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.student_id} — {s.full_name} ({s.department}) {s.is_face_registered ? '✓' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Student Information Card */}
            {selectedStudent && (
              <div className="p-4 rounded-2xl bg-[#0a0d18] border border-[#1f294d] space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-white text-base">
                    {selectedStudent.photo_url ? (
                      <img
                        src={selectedStudent.photo_url}
                        alt={selectedStudent.full_name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      selectedStudent.first_name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedStudent.full_name}</h3>
                    <p className="text-xs font-mono text-purple-400">{selectedStudent.student_id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#1f294d]/60 text-slate-300">
                  <div>
                    <span className="text-slate-500">Department:</span> {selectedStudent.department}
                  </div>
                  <div>
                    <span className="text-slate-500">Year:</span> {selectedStudent.academic_year}
                  </div>
                  <div>
                    <span className="text-slate-500">Section:</span> {selectedStudent.section}
                  </div>
                  <div>
                    <span className="text-slate-500">Face Status:</span>{' '}
                    <span className={selectedStudent.is_face_registered ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      {selectedStudent.is_face_registered ? 'Already Enrolled' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Biometric Algorithm Specification Info */}
            <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Feature Pipeline:</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                <li>CLAHE illumination adaptive histogram balancing</li>
                <li>2D Discrete Cosine Transform (DCT) facial geometry</li>
                <li>128-D L2 unit normalized cosine embedding vector</li>
              </ul>
            </div>

            {/* Enroll Biometrics Button */}
            <button
              type="button"
              disabled={loading || capturedSamples.length === 0 || !selectedStudentId}
              onClick={handleEnrollBiometrics}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {loading
                  ? 'Calculating Embeddings & Enrolling...'
                  : `Save & Enroll Biometrics for ${selectedStudent?.first_name || 'Student'}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
