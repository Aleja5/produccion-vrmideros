import React from "react";
import { useParams } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import RegistroProduccion from "../components/RegistroProduccion";

export default function RegistroProduccionPage() {
    const { jornadaId } = useParams(); // Obtener el jornadaId de los parámetros de la URL

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex justify-center items-start py-10 px-6 overflow-y-auto">
                <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-8">
                    <RegistroProduccion jornadaId={jornadaId} />
                </div>
            </div>
        </div>
    );
}
