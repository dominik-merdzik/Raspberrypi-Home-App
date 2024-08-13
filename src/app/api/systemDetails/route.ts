import { NextResponse } from 'next/server';
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
    console.log(`Uptime fetched: ${stdout.trim()}`);  // Add this logging
    return stdout.trim();
  } catch (error) {
    return "0 minutes";
  }
}

async function getActiveProcesses() {
  try {
    const { stdout } = await execAsync("ps ax | wc -l");
    return stdout.trim();
  } catch (error) {
    return "0";
  }
}

async function getCpuModel() {
  const cpus = os.cpus();
  return cpus.length > 0 ? cpus[0].model : "Unknown";
}

async function getLoadAverage() {
  const load = os.loadavg();
  return load.map((avg) => avg.toFixed(2)).join(", ");
}

async function getFilesystemInfo() {
  try {
    const { stdout } = await execAsync("df -h | awk 'NR>1{print $1, $2, $3, $5}'");
    const filesystems = stdout.trim().split("\n").map((line: string) => {
      const [filesystem, size, used, usePercent] = line.split(" ");
      return { filesystem, size, used, usePercent };
    });
    return filesystems;
  } catch (error) {
    return [];
  }
}

function bytesToGB(bytes: number) {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}

function isRaspberryPi() {
  return os.platform() === "linux" && os.arch().startsWith("arm64");
}

export async function GET() {
  const hostname = os.hostname();
  const platform = os.platform();
  const architecture = os.arch();

  if (!isRaspberryPi()) {
    // Boilerplate data for non-Raspberry Pi environments
    const boilerplateFilesystem = [
      { filesystem: "/dev/root", size: "30G", used: "15G", usePercent: "50%" },
      { filesystem: "/dev/sda1", size: "100G", used: "20G", usePercent: "20%" },
    ];

    return NextResponse.json({
      hostname,
      platform,
      architecture,
      cpuTemp: 0.0,
      cpuUsage: ["0.0", "0.0", "0.0", "0.0"],
      memoryUsage: {
        total: 1.0,
        used: 0.5,
        free: 0.5,
      },
      diskUsage: "0%",
      uptime: "0 minutes",
      activeProcesses: "0",
      cpuModel: "Unknown",
      loadAverage: "0.00, 0.00, 0.00",
      filesystem: boilerplateFilesystem,
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  const cpuUsage = getCpuUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpuTemp = await getCpuTemp();
  const diskUsage = await getDiskUsage();
  const uptime = await getUptime();
  console.log(`API route called. Uptime: ${uptime}`);
  const activeProcesses = await getActiveProcesses();
  const cpuModel = await getCpuModel();
  const loadAverage = await getLoadAverage();
  const filesystem = await getFilesystemInfo();

  return NextResponse.json({
    hostname,
    platform,
    architecture,
    cpuTemp,
    cpuUsage,
    memoryUsage: {
      total: parseFloat(bytesToGB(totalMem)),
      used: parseFloat(bytesToGB(usedMem)),
      free: parseFloat(bytesToGB(freeMem)),
    },
    diskUsage,
    uptime,
    activeProcesses,
    cpuModel,
    loadAverage,
    filesystem,
  }, {
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}
