import React from "react";
import { useParams } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import RegistroProduccion from "../components/RegistroProduccion";

export default function RegistroProduccionPage() {
    const { jornadaId } = useParams(); // Obtener el jornadaId de los parámetros de la URL

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="container mx-auto px-4 py-6">
                    <RegistroProduccion jornadaId={jornadaId} />
                </div>
            </div>
        </div>
    );
}
