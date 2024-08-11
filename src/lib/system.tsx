import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function getCpuUsage() {
  const cpus = os.cpus();
  return cpus.map((cpu) => {
    const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
    const usage = 100 - (100 * cpu.times.idle) / total;
    return usage.toFixed(1);
  });
}

async function getCpuTemp() {
  try {
    const { stdout } = await execAsync("vcgencmd measure_temp");
    return parseFloat(stdout.replace("temp=", "").replace("'C", ""));
  } catch (error) {
    return 0.0;
  }
}

async function getDiskUsage() {
  try {
    const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $5}'");
    return stdout.trim();
  } catch (error) {
    return "0%";
  }
}

async function getUptime() {
  try {
    const { stdout } = await execAsync("uptime -p");
    return stdout.trim();
  } catch (error) {
    return "0 minutes";
  }
}

function bytesToGB(bytes: number) {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}

export async function getSystemDetails() {
  const isRaspberryPi = os.platform() === "linux" && os.arch() === "arm";

  if (!isRaspberryPi) {
    return {
      os,
      cpuTemp: 0.0,
      cpuUsage: ["0.0", "0.0", "0.0", "0.0"],
      memoryUsage: {
        total: 1.0,
        used: 0.5,
        free: 0.5,
      },
      diskUsage: "0%",
      uptime: "0 minutes",
    };
  }

  const cpuUsage = getCpuUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpuTemp = await getCpuTemp();
  const diskUsage = await getDiskUsage();
  const uptime = await getUptime();

  return {
    os,
    cpuTemp,
    cpuUsage,
    memoryUsage: {
      total: parseFloat(bytesToGB(totalMem)),
      used: parseFloat(bytesToGB(usedMem)),
      free: parseFloat(bytesToGB(freeMem)),
    },
    diskUsage,
    uptime,
  };
}
