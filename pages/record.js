import { useRef, useState, useEffect } from 'react';

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
      console.log(deviceInfos);
      const videoDevices = deviceInfos.filter((device) => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    });
  }, []);

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const constraints = {
        video: { 
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          aspectRatio: 9 / 16 
        },
        audio:true
        // Additional constraints can be added if needed
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "video/webm" });
      mediaRecorderRef.current.addEventListener("dataavailable", event => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      });

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } else {
      alert("Sorry, your browser does not support video recording.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setIsRecording(false);
  };

  const downloadRecording = () => {
    const blob = new Blob(recordedChunks, {
      type: "video/webm",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "recording.webm";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeviceChange = (event) => {
    setSelectedDeviceId(event.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {devices.length > 0 && (
        <select onChange={handleDeviceChange} value={selectedDeviceId} className="mb-4 text-center">
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${index + 1}`}
            </option>
          ))}
        </select>
      )}
      {/* <video
        ref={videoRef}
        className="w-2/3 md:w-1/3 aspect-video"
        style={{ aspectRatio: '9 / 16' }}
      /> */}
      <video ref={videoRef} className="rounded-lg border-4 border-gray-300" muted />
      <div className="mt-4">
        {isRecording ? (
          <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={stopRecording}>Stop Recording</button>
        ) : (
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={startRecording}>Start Recording</button>
        )}
        <button className="ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={downloadRecording} disabled={recordedChunks.length === 0}>Download</button>
      </div>
    </div>
  );
}
