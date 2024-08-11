import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white dark:bg-gray-900 dark:text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Welcome to Dominik's Raspberry Pi Dashboard</h1>

      <Link href="/stats">
        <a className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          View Stats
        </a>
      </Link>
    </main>
  );
}
