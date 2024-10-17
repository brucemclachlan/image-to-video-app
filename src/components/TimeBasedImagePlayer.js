import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, RotateCcw, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const TimeBasedImagePlayer = () => {
  const [images, setImages] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef(null);

  // Handle file uploads
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    Promise.all(
      files.map(file => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target.result;
          img.onload = () => {
            resolve({
              url: e.target.result,
              date: new Date(file.lastModified),
              name: file.name,
              width: img.width,
              height: img.height
            });
          };
        };
        reader.readAsDataURL(file);
      }))
    ).then(loadedImages => {
      const sortedImages = loadedImages.sort((a, b) => a.date - b.date);
      const firstDate = sortedImages[0].date;
      const lastDate = sortedImages[sortedImages.length - 1].date;
      const durationInDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));

      setDuration(durationInDays);
      setImages(sortedImages);
      setCurrentFrame(0);
      setIsPlaying(false);
    });
  };

  // Animation loop
  useEffect(() => {
    if (!images.length) return;

    let animationFrame;
    const startTime = images[0].date.getTime();

    const animate = () => {
      if (isPlaying) {
        const currentTime = startTime + (currentFrame * 1000);
        const currentImage = images.reduce((prev, curr) => {
          return Math.abs(curr.date - currentTime) < Math.abs(prev.date - currentTime) ? curr : prev;
        });

        if (currentFrame < duration) {
          setCurrentFrame(prev => prev + 1);
          animationFrame = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
        }
      }
    };

    if (isPlaying) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, images, currentFrame, duration]);

  // Export video
  const exportVideo = async () => {
    if (!images.length || isExporting) return;
    setIsExporting(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match first image
    canvas.width = 1920;  // HD video width
    canvas.height = 1080; // HD video height

    try {
      // Create MediaRecorder
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timelapse.webm';
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      mediaRecorder.start();

      // Render frames
      let frame = 0;
      const startTime = images[0].date.getTime();

      const renderFrame = () => {
        if (frame >= duration) {
          mediaRecorder.stop();
          return;
        }

        const currentTime = startTime + (frame * 1000);
        const currentImage = images.reduce((prev, curr) => {
          return Math.abs(curr.date - currentTime) < Math.abs(prev.date - currentTime) ? curr : prev;
        });

        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Calculate scaling to maintain aspect ratio
          const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
          );
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;

          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

          frame++;
          requestAnimationFrame(renderFrame);
        };
        img.src = currentImage.url;
      };

      renderFrame();
    } catch (error) {
      console.error('Error exporting video:', error);
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  const handleSliderChange = (value) => {
    setCurrentFrame(value[0]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                <Upload size={20} />
                <span>Upload Images</span>
              </div>
            </label>
          </div>

          {images.length > 0 && (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={images[Math.min(
                    images.length - 1,
                    images.findIndex(img =>
                      img.date >= new Date(images[0].date.getTime() + currentFrame * 1000)
                    )
                  )].url}
                  alt="Current frame"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                  >
                    <RotateCcw size={20} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={exportVideo}
                    disabled={isExporting}
                  >
                    <Download size={20} />
                  </Button>
                </div>

                <Slider
                  value={[currentFrame]}
                  max={duration}
                  step={1}
                  onValueChange={handleSliderChange}
                  className="w-full"
                />

                <div className="text-center text-sm text-gray-500">
                  {images[Math.min(
                    images.length - 1,
                    images.findIndex(img =>
                      img.date >= new Date(images[0].date.getTime() + currentFrame * 1000)
                    )
                  )].name}
                </div>
              </div>
            </div>
          )}

          {/* Hidden canvas for video export */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeBasedImagePlayer;
