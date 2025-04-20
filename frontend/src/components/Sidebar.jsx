import React from "react";
import logo from "../assets/logo.png";

export const Sidebar = () => {
    return (
        <div className="h-full flex flex-col bg-gray-800 text-white">
            <div className="flex justify-center items-center py-4">
                <img src={logo} alt="Logo" className="h-35" />
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                <a href="/operario-dashboard" className="block hover:text-primary">Registros de Produccion</a>
                <a href="/validate-cedula" className="block hover:text-primary">Salir</a>
            </nav>
        </div>
    );
};