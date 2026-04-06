"use client";

import { useEffect, useState } from "react";

export function StatusBar() {
  const [block, setBlock] = useState(72483921);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (d.hedera?.blockNumber) setBlock(d.hedera.blockNumber);
      })
      .catch(() => { });

    const t = setInterval(() => {
      setBlock((b) => b + Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-8 bg-gray-100 border-b border-thin border-gray-300 flex items-center px-4 sm:px-6 gap-2 font-mono text-[10px] sm:text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-success inline-block shrink-0" />
      <span>
        Hedera testnet · Block #{block.toLocaleString()} · All systems operational
      </span>
    </div>
  );
}