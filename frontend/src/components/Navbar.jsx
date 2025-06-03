import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, MenuItem } from './ui/Menu';
import logo from '../assets/2.png';
import { UserCircle2 } from 'lucide-react';

// Corregido: 'operaraioName' a 'operarioName'
export default function Navbar({ operarioName }) { 
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        // Aquí puedes limpiar el token o cualquier dato de sesión
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center h-25">
            <div className="flex items-center space-x-2">
                {/* Ajuste la clase del logo para que se vea bien dentro del navbar de 20 de altura */}
                <img src={logo} alt="Logo" className="h-full max-h-30 w-auto " /> 
            </div>
            
            {/* Contenedor para el icono de usuario y el nombre del operario */}
          <div className="flex flex-col items-center space-y-1">
    
    <span className="text-sm font-medium">{operarioName}</span>
</div>

<div className="md:hidden">
    <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="ml-4 focus:outline-none"
    >
        ☰
    </button>
    {isMenuOpen && (
        <Menu>
            <MenuItem>
                <Link to="/validate-cedula">Validar Cedula</Link>
            </MenuItem>
            <MenuItem>
                <Link to="/registro-produccion">Registrar Produccion</Link>
            </MenuItem>
            <MenuItem>
                <button onClick={handleLogout}>Logout</button>
            </MenuItem>
        </Menu>
    )}
        </div>
 
        </nav>
    );
}