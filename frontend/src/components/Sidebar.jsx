import React, { useState, useEffect } from "react";
import { Home, PlusCircle, ClipboardList, History, LogOut, ChevronLeft, ChevronRight} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import logo from '../assets/2.png'; 

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed") === "true";
    setCollapsed(saved);
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState);
  };

  const handleLogout = () => {
    navigate("/validate-cedula");
  };

  const menuItems = [
    { to: "/operario-dashboard", icon: Home, label: "Inicio" },
    { to: "/registro-produccion", icon: PlusCircle, label: "Registrar Actividad" },
    { to: "/mi-jornada", icon: ClipboardList, label: "Mi Jornada Actual" },
    { to: "/historial-jornadas", icon: History, label: "Historial de Jornadas" },
  ];

  return (
    <motion.div
      className={`h-screen bg-gray-800 text-white shadow-md transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } flex flex-col`}
      initial={{ width: collapsed ? 64 : 256 }}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.1 }}
    >
      {/* Logo and Toggle Button */}
      <div className={`flex items-center p-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <img src={logo} alt="Logo" className="h-30 w-auto" /> // Mostrar logo cuando no está colapsado
        )}
        <button
          onClick={toggleSidebar}
          className="text-white focus:outline-none"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Menu de navegación - Usará el espacio restante y permitirá scroll */}
      {/* Añadido 'flex-grow' y 'min-h-0' para asegurar que el 'overflow-y-auto' funcione correctamente */}
      <nav className="flex-grow min-h-0 px-2 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2 p-2 rounded-md ${
              location.pathname.startsWith(to)
                ? "bg-gray-700"
                : "hover:bg-gray-700"
            }`}
          >
            <Icon className="text-white" size={20} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout - Se pegará al fondo con un margen y un estilo distintivo */}
      {/* Añadido 'mt-auto' para empujarlo al final, y 'pb-4' para darle espacio desde abajo */}
      <div className="mt-auto p-2 pb-4 border-t border-gray-700"> {/* Cambié p-2 por p-2 pb-4 */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md w-full text-red-400 hover:text-red-300"
          aria-label="Salir"
        >
          <LogOut className="text-red-400" size={20} />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </motion.div>
  );
};