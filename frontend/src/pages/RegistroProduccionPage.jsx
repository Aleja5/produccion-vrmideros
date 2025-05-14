import React from "react";
import { Sidebar } from "../components/Sidebar";
import RegistroProduccion from "../components/RegistroProduccion";

export default function RegistroProduccionPage() {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex justify-center items-start py-10 px-6 overflow-y-auto">
                <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-8">
                    {/* Aquí se renderiza el nuevo componente RegistroProduccion */}
                    <RegistroProduccion />
                </div>
            </div>
        </div>
    );
}
    