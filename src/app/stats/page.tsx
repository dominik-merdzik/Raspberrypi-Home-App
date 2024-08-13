"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const updateInterval = 5000; // Update every 5 seconds

  useEffect(() => {
    async function fetchSystemDetails() {
      const res = await fetch('/api/systemDetails');
      const data = await res.json();
      setSystemInfo(data);
    }

    // Fetch the data immediately when the component mounts
    fetchSystemDetails();

    // Set up the interval to update data every few seconds
    const intervalId = setInterval(fetchSystemDetails, updateInterval);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  if (!systemInfo) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 dark-theme">
      <h1 className="text-3xl font-bold mb-6 text-center">Dominik's Raspberry Pi Stats</h1>

      <Card className="w-full max-w-md bg-gray-800">
        <CardHeader>
          <CardTitle className="text-white">System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {[
              ["Hostname", systemInfo.hostname],
              ["Platform", systemInfo.platform],
              ["Architecture", systemInfo.architecture],
              ["CPU Temperature", `${systemInfo.cpuTemp.toFixed(1)}°C`],
              ["Disk Usage", systemInfo.diskUsage],
              ["Uptime", systemInfo.uptime],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}:</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">CPU Usage</h3>
            {systemInfo.cpuUsage.map((usage: string, index: number) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Core {index}</span>
                  <span>{usage}%</span>
                </div>
                <Progress value={parseFloat(usage)} className="h-2 bg-gray-700" />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Memory Usage</h3>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Total</span>
              <span>{systemInfo.memoryUsage.total.toFixed(2)} GB</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Used</span>
              <span>{systemInfo.memoryUsage.used.toFixed(2)} GB</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Free</span>
              <span>{systemInfo.memoryUsage.free.toFixed(2)} GB</span>
            </div>
            <Progress 
              value={(systemInfo.memoryUsage.used / systemInfo.memoryUsage.total) * 100} 
              className="h-2 bg-gray-700" 
            />
          </div>

          <button
            className="text-blue-500 hover:text-blue-400 text-sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "Hide Advanced ↑" : "Advanced ↓"}
          </button>

          {showAdvanced && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Advanced Information</h3>
                {[
                  ["Active Processes", systemInfo.activeProcesses],
                  ["CPU Model", systemInfo.cpuModel],
                  ["Load Average", systemInfo.loadAverage],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}:</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Filesystem Information</h3>
                {systemInfo.filesystem.map((fs: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm text-gray-400">
                    <span>{fs.filesystem}:</span>
                    <span className="text-white font-medium">
                      {fs.used}/{fs.size} ({fs.usePercent})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
