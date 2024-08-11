import { getSystemDetails } from "@/lib/system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function Home() {
  const systemInfo = await getSystemDetails();

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
              ["Hostname", systemInfo.os.hostname()],
              ["Platform", systemInfo.os.platform()],
              ["Architecture", systemInfo.os.arch()],
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
            {systemInfo.cpuUsage.map((usage, index) => (
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
              <span>Used</span>
              <span>{systemInfo.memoryUsage.used.toFixed(2)} / {systemInfo.memoryUsage.total.toFixed(2)} GB</span>
            </div>
            <Progress 
              value={(systemInfo.memoryUsage.used / systemInfo.memoryUsage.total) * 100} 
              className="h-2 bg-gray-700" 
            />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
