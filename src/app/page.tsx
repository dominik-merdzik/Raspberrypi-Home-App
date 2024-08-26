import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white dark-theme">
      <h1 className="text-3xl font-bold mb-6 text-center">Welcome to Dominik's Raspberry Pi </h1>

      <Link legacyBehavior href="/stats">
        <a className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          View Stats 📊
        </a>
      </Link>
      <Link legacyBehavior href="/gochat">
        <a className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded my-2">
          Go Chat 💬
        </a>
      </Link>
    </main>
  );
}
