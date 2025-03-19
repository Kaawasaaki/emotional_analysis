import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Upload } from 'lucide-react';

function App() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();
  }, []);

  const analyzeImage = async () => {
    if (!imageRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    try {
      const detections = await faceapi
        .detectAllFaces(imageRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections.length > 0) {
        const canvas = canvasRef.current;
        const displaySize = {
          width: imageRef.current.width,
          height: imageRef.current.height,
        };
        faceapi.matchDimensions(canvas, displaySize);

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Clear previous drawings
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        // Draw detections and expressions
        faceapi.draw.drawDetections(canvas, resizedDetections);
        
        // Get emotions data
        setEmotions(detections[0].expressions);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    }
    setIsAnalyzing(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setEmotions(null);
    }
  };

  const handleImageLoad = () => {
    if (imageRef.current && canvasRef.current) {
      canvasRef.current.width = imageRef.current.width;
      canvasRef.current.height = imageRef.current.height;
      analyzeImage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Face Emotion Analysis
          </h1>

          {!modelsLoaded ? (
            <div className="text-center text-gray-600">
              Loading models... Please wait...
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex justify-center gap-4 mb-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload size={20} />
                    Upload Image
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="relative">
                {imageUrl && (
                  <>
                    <img
                      ref={imageRef}
                      src={imageUrl}
                      onLoad={handleImageLoad}
                      className="max-w-full h-auto rounded-lg"
                      alt="Uploaded image"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0"
                    />
                  </>
                )}
              </div>

              {isAnalyzing && (
                <div className="text-center mt-4 text-gray-600">
                  Analyzing image...
                </div>
              )}

              {emotions && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Detected Emotions:</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(emotions).map(([emotion, probability]) => (
                      <div
                        key={emotion}
                        className="bg-gray-50 p-4 rounded-lg"
                      >
                        <div className="font-medium capitalize">{emotion}</div>
                        <div className="text-gray-600">
                          {(Number(probability) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;