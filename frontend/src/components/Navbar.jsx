import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, MenuItem } from './ui/Menu';
import logo from '../assets/2.png';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí puedes limpiar el token o cualquier dato de sesión
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center h-20">
      <div className="flex items-center space-x-2">
        <img src={logo} alt="Logo" className="h-30 w-auto" />
        
      </div>
      <ul className="hidden md:flex space-x-4">
        <li>
          <button onClick={handleLogout} className="hover:underline">Logout</button>
        </li>
      </ul>
      <div className="md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="focus:outline-none"
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
