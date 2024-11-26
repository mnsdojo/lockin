import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Lock, Unlock } from "lucide-react";
import { Label } from "@radix-ui/react-label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
function FocusLock() {
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [error, setError] = useState("");

  const handleLock = () => {
    if (!url || !duration) {
      setError("Please enter both URL and duration.");
      return;
    }
    const durationInMinutes = parseInt(duration);
    if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
      setError("Please enter a valid duration in minutes");
      return;
    }
    setError("");
    setIsLocked(true);
    setRemainingTime(durationInMinutes * 60);
    chrome.storage.local.set({
      lockedUrl: url,
      duration: durationInMinutes,
      startTime: Date.now(),
    });
  };
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}: ${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleUnlock = () => {
    setIsLocked(false);
    setUrl("");
    setDuration("");
    setRemainingTime(0);
    chrome.storage.local.remove(["lockedUrl", "duration", "startTime"]);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isLocked && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);
    } else if (remainingTime === 0 && isLocked) {
      setIsLocked(false);
    }
    return () => clearInterval(timer);
  }, [isLocked, remainingTime]);

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">LockIn</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLocked}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={isLocked}
            />
          </div>

          {isLocked ? (
            <div className="text-center">
              <p className="text-lg font-semibold">Locked to : {url}</p>
              <p className="text-xl font-bold">
                Time remaining: {formatTime(remainingTime)}
              </p>
              <Button variant="destructive" onClick={handleUnlock}>
                <Unlock className="mr-2 h-4 w-4" /> Unlock
              </Button>
            </div>
          ) : (
            <Button onClick={handleLock}>
              <Lock className="mr-2 h-4 w-4" /> Lock Focus
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FocusLock;
