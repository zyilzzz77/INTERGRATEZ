"use client";

import { motion } from "framer-motion";
import { Infinity } from "lucide-react";

export default function UnlimitedBadge() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-orange-500/30 shadow-sm"
        >
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8],
                }}
                transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                className="flex items-center justify-center text-orange-500"
            >
                <Infinity className="w-5 h-5 stroke-[2.5]" />
            </motion.div>
            <span className="text-xs font-black bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent uppercase tracking-wider">
                Unlimited
            </span>
        </motion.div>
    );
}
