import React, { useState, useEffect } from "react";
import { Home, PlusCircle, ClipboardList, History, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

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
    localStorage.removeItem("token");
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
      className={`h-full bg-gray-800 text-white shadow-md transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } flex flex-col`}
      initial={{ width: collapsed ? 64 : 256 }}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-2">
        <button
          onClick={toggleSidebar}
          className="text-white focus:outline-none"
          aria-label="Toggle sidebar"
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-4 space-y-2">
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

      {/* Logout */}
      <div className="p-2 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md w-full"
          aria-label="Cerrar sesión"
        >
          <LogOut className="text-white" size={20} />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </motion.div>
  );
};