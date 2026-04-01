"use client";

import { useEffect } from "react";

export default function LoginSuccess() {
    useEffect(() => {
        // Check if inside a popup
        if (window.opener && !window.opener.closed) {
            window.close();
        } else {
            window.location.href = "/";
        }
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#fff6e8] p-4 text-center">
            <div className="rounded-xl border-[3px] border-black bg-white p-8 shadow-neo max-w-sm w-full mx-auto">
                <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <h1 className="text-2xl font-black text-black">Login Berhasil!</h1>
                <p className="mt-2 text-sm font-bold text-gray-600">Jendela ini akan otomatis tertutup.</p>
            </div>
        </div>
    );
}
