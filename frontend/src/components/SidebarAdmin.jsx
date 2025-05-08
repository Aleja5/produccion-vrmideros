import React, { useState } from "react";
import { User, Cpu, Building, Settings, BarChart2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

export const SidebarAdmin = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div
      className={`h-full bg-gray-800 text-white shadow-md transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } flex flex-col`}
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-2">
        <button onClick={toggleSidebar} className="text-white focus:outline-none">
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        <Link to="/admin/usuarios" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md">
        <User className="text-white" size={20} />
          {!collapsed && <span>Gestión de Usuarios</span>}
        </Link>

        <Link to="/admin/maquinas" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md">
        <Cpu className="text-white" size={20} />
          {!collapsed && <span>Gestión de Máquinas</span>}
        </Link>

        <Link to="/admin/areas" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md">
        <Building className="text-white" size={20} />
          {!collapsed && <span>Áreas de Producción</span>}
        </Link>

        <Link to="/admin/procesos" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md">
        <Settings className="text-white" size={20} />
          {!collapsed && <span>Gestión de Procesos</span>}
        </Link>

        <Link to="/admin/insumos" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md">
        <Cpu className="text-white" size={20} />
          {!collapsed && <span>Gestión de Insumos</span>}
        </Link>

        <Link to="/admin/operarios" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md">
        <BarChart2 className="text-white" size={20} />
          {!collapsed && <span>Operarios</span>}
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-700">
        <button onClick={handleLogout} className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md w-full">
          <LogOut className="text-white" size={20} />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};
