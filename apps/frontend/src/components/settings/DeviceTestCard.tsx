import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface DeviceOption {
    deviceId: string;
    label: string;
}

type FeedbackType = 'idle' | 'info' | 'success' | 'error';

export const DeviceTestCard: React.FC = () => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number>();
    const currentStreamRef = useRef<MediaStream | null>(null);

    const [cameras, setCameras] = useState<DeviceOption[]>([]);
    const [microphones, setMicrophones] = useState<DeviceOption[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [selectedMicrophoneId, setSelectedMicrophoneId] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string }>({
        type: 'idle',
        message: ''
    });

    const supportsMediaDevices = typeof navigator !== 'undefined'
        && Boolean(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices);

    const stopStream = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }

        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }

        if (audioSourceRef.current) {
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => undefined);
            audioContextRef.current = null;
        }

        const stream = currentStreamRef.current;
        stream?.getTracks().forEach(track => track.stop());
        currentStreamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setAudioLevel(0);
        setIsTesting(false);
    };

    const refreshDeviceList = async () => {
        if (!supportsMediaDevices) {
            return;
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs: DeviceOption[] = [];
            const audioInputs: DeviceOption[] = [];

            devices.forEach(device => {
                if (device.kind === 'videoinput') {
                    videoInputs.push({ deviceId: device.deviceId, label: device.label || t('deviceTest.unknownCamera') });
                }
                if (device.kind === 'audioinput') {
                    audioInputs.push({ deviceId: device.deviceId, label: device.label || t('deviceTest.unknownMicrophone') });
                }
            });

            setCameras(videoInputs);
            setMicrophones(audioInputs);

            if (!selectedCameraId && videoInputs.length > 0) {
                setSelectedCameraId(videoInputs[0].deviceId);
            }
            if (!selectedMicrophoneId && audioInputs.length > 0) {
                setSelectedMicrophoneId(audioInputs[0].deviceId);
            }
        } catch (error) {
            setFeedback({ type: 'error', message: t('deviceTest.permissionHint') });
        }
    };

    useEffect(() => {
        refreshDeviceList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => () => {
        stopStream();
    }, []);

    const startAudioVisualization = (stream: MediaStream) => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
            return;
        }

        const audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        audioSourceRef.current = source;
        analyserRef.current = analyser;

        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
            analyser.getByteTimeDomainData(dataArray);
            let sumSquares = 0;
            for (let i = 0; i < bufferLength; i += 1) {
                const value = dataArray[i] - 128;
                sumSquares += value * value;
            }
            const rms = Math.sqrt(sumSquares / bufferLength);
            const normalized = Math.min(rms / 128, 1);
            setAudioLevel(normalized);
            animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
    };

    const handleTest = async () => {
        if (!supportsMediaDevices) {
            setFeedback({ type: 'error', message: t('deviceTest.unsupported') });
            return;
        }

        if (!selectedCameraId || !selectedMicrophoneId) {
            setFeedback({ type: 'error', message: t('deviceTest.selectDevices') });
            return;
        }

        setFeedback({ type: 'info', message: t('deviceTest.loading') });

        try {
            stopStream();
            const constraints: MediaStreamConstraints = {
                video: { deviceId: { exact: selectedCameraId } },
                audio: { deviceId: { exact: selectedMicrophoneId } }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            currentStreamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => undefined);
            }

            startAudioVisualization(stream);
            setIsTesting(true);
            setFeedback({ type: 'info', message: t('deviceTest.testing') });

            // Refresh device labels now that permission is granted
            refreshDeviceList();
        } catch (error) {
            console.error('Device test failed:', error);
            setFeedback({ type: 'error', message: t('deviceTest.error') });
        }
    };

    const handleConfirm = () => {
        stopStream();
        setFeedback({ type: 'success', message: t('deviceTest.success') });
    };

    const handleStop = () => {
        stopStream();
        setFeedback({ type: 'idle', message: '' });
    };

    return (
        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <span aria-hidden>🎥</span>
                        {t('deviceTest.title')}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-xl">
                        {t('deviceTest.subtitle')}
                    </p>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                    {!isTesting && (
                        <button
                            type="button"
                            onClick={handleTest}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600"
                        >
                            {t('deviceTest.testButton')}
                        </button>
                    )}
                    {isTesting && (
                        <>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600"
                            >
                                {t('deviceTest.confirmButton')}
                            </button>
                            <button
                                type="button"
                                onClick={handleStop}
                                className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-200"
                            >
                                {t('deviceTest.stopButton')}
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700" htmlFor="camera-select">
                        {t('deviceTest.cameraLabel')}
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
                            🎥
                        </span>
                        <select
                            id="camera-select"
                            value={selectedCameraId}
                            onChange={(event) => setSelectedCameraId(event.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                            disabled={!supportsMediaDevices || cameras.length === 0}
                        >
                            {cameras.length === 0 && (
                                <option value="" disabled>
                                    {t('deviceTest.noCamera')}
                                </option>
                            )}
                            {cameras.map(camera => (
                                <option key={camera.deviceId} value={camera.deviceId}>
                                    {camera.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <label className="block text-sm font-medium text-gray-700" htmlFor="microphone-select">
                        {t('deviceTest.microphoneLabel')}
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
                            🎙️
                        </span>
                        <select
                            id="microphone-select"
                            value={selectedMicrophoneId}
                            onChange={(event) => setSelectedMicrophoneId(event.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                            disabled={!supportsMediaDevices || microphones.length === 0}
                        >
                            {microphones.length === 0 && (
                                <option value="" disabled>
                                    {t('deviceTest.noMicrophone')}
                                </option>
                            )}
                            {microphones.map(microphone => (
                                <option key={microphone.deviceId} value={microphone.deviceId}>
                                    {microphone.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                                <span aria-hidden>🎙️</span>
                                {t('deviceTest.volumeLabel')}
                            </span>
                            <span className="font-medium text-gray-700">
                                {Math.round(audioLevel * 100)}%
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                                className="h-full rounded-full bg-green-500 transition-all duration-200 ease-out"
                                style={{ width: `${Math.max(audioLevel * 100, 4)}%`, opacity: isTesting ? 1 : 0.3 }}
                            />
                        </div>
                        <p className="text-xs text-gray-400">
                            {t('deviceTest.volumeHint')}
                        </p>
                    </div>
                </div>

                <div className="relative flex flex-col">
                    <div className="relative overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-gray-50 shadow-inner">
                        <div className={`absolute inset-0 flex items-center justify-center text-sm text-gray-500 transition-opacity duration-300 ${isTesting ? 'opacity-0' : 'opacity-100'}`}>
                            {t('deviceTest.previewPlaceholder')}
                        </div>
                        <video
                            ref={videoRef}
                            className={`w-full rounded-2xl object-cover transition duration-500 ${isTesting ? 'opacity-100' : 'opacity-0'} min-h-[220px] bg-black`}
                            playsInline
                            muted
                        />
                    </div>
                    {feedback.message && (
                        <div
                            className={`mt-4 rounded-xl border px-4 py-3 text-sm transition-all duration-300 ${feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' :
                                    feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' :
                                        feedback.type === 'info' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                            'border-transparent'
                                }`}
                        >
                            {feedback.message}
                        </div>
                    )}
                </div>
            </div>

            {!supportsMediaDevices && (
                <p className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    {t('deviceTest.unsupported')}
                </p>
            )}
        </section>
    );
};
