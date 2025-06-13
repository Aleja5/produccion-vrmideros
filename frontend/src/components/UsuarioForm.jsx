import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Asegúrate de tenerlo importado
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

// Importa tus componentes de UI
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { User, Mail, Lock, Save, XCircle, Loader2, Info, CheckCircle } from 'lucide-react';

const UsuarioForm = ({ usuarioInicial, onGuardar, onCancelar, isLoading, showSuccessMessage, savedUserData }) => {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('production');
    const [errors, setErrors] = useState({});
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    const isEditing = Boolean(usuarioInicial);    useEffect(() => {
        console.log('UsuarioForm - usuarioInicial:', usuarioInicial); // Debug log
        if (!showSuccessMessage) {
            if (usuarioInicial) {
                setNombre(usuarioInicial.nombre || '');
                setEmail(usuarioInicial.email || '');
                setRole(usuarioInicial.role || 'production');
                setPassword('');
                setConfirmPassword('');
                setShowPasswordFields(false); // Ocultar campos de contraseña por defecto al editar
                console.log('Datos del usuario cargados:', { // Debug log
                    nombre: usuarioInicial.nombre,
                    email: usuarioInicial.email,
                    role: usuarioInicial.role
                });
            } else {
                setNombre('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setRole('production');
                setShowPasswordFields(true); // Mostrar campos de contraseña al crear
                console.log('Formulario en modo crear - campos limpiados'); // Debug log
            }
            setErrors({});
        }
    }, [usuarioInicial, showSuccessMessage]);

    const validateForm = () => {
        let newErrors = {};
        if (!nombre.trim()) {
            newErrors.nombre = 'El nombre es obligatorio.';
        }
        if (!email.trim()) {
            newErrors.email = 'El correo electrónico es obligatorio.';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Formato de correo electrónico inválido.';
        }        const isEditingWithoutPasswordChange = isEditing && !showPasswordFields;
        if (!isEditingWithoutPasswordChange) {
            if (!password) {
                newErrors.password = 'La contraseña es obligatoria.';
            } else if (password.length < 6) { // <--- CAMBIO AQUÍ: de 8 a 6 caracteres
                newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
            }
            if (password !== confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) {
            toast.error("Por favor, corrige los errores del formulario.");
            return;
        }        const userData = { nombre, email, role };
        if (showPasswordFields && password) {
            userData.password = password;
        }

        try {
            await onGuardar(userData);
        } catch (error) {
            console.error("Error en handleSubmit de UsuarioForm:", error);
        }
    };

    return (
        <Card className="w-full max-w-lg mx-auto p-6 md:p-8 bg-white rounded-xl shadow-2xl transition-all duration-300 ease-in-out">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-800">
                    {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </CardTitle>
                <CardDescription className="text-gray-500 mt-2">
                    {isEditing ? 'Actualiza la información del usuario.' : 'Ingresa los detalles para un nuevo usuario.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="mt-6">
                {showSuccessMessage && savedUserData ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg text-center mb-6 flex flex-col items-center justify-center"
                    >
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4 animate-bounce-in" />
                        <h3 className="text-2xl font-bold mb-2">¡Operación Exitosa!</h3>
                        <p className="text-lg font-medium">
                            {isEditing ? "Usuario actualizado:" : "Usuario creado:"}
                        </p>
                        <p className="text-lg mt-2">
                            <span className="font-semibold text-gray-700">Nombre:</span> {savedUserData.nombre}
                        </p>
                        <p className="text-lg">
                            <span className="font-semibold text-gray-700">Correo:</span> {savedUserData.email}
                        </p>
                        <p className="text-lg">
                            <span className="font-semibold text-gray-700">Rol:</span> {savedUserData.role ? (savedUserData.role.charAt(0).toUpperCase() + savedUserData.role.slice(1)) : 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 mt-4">
                            Redirigiendo a la lista de usuarios en breve...
                        </p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>                            <label htmlFor="nombre" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <User className="mr-2 h-4 w-4 text-blue-500" />
                                Nombre Completo:
                            </label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    id="nombre"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.nombre ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                    required
                                    aria-invalid={errors.nombre ? "true" : "false"}
                                    aria-describedby="nombre-error"
                                />
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                            {errors.nombre && <p id="nombre-error" className="text-red-500 text-xs mt-1 flex items-center"><Info className="h-3 w-3 mr-1" />{errors.nombre}</p>}
                        </div>

                        <div>                            <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <Mail className="mr-2 h-4 w-4 text-blue-500" />
                                Correo Electrónico:
                            </label>
                            <div className="relative">
                                <Input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ejemplo@dominio.com"
                                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                    required
                                    aria-invalid={errors.email ? "true" : "false"}
                                    aria-describedby="email-error"
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                            {errors.email && <p id="email-error" className="text-red-500 text-xs mt-1 flex items-center"><Info className="h-3 w-3 mr-1" />{errors.email}</p>}
                        </div>

                        <div>                            <label htmlFor="role" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <User className="mr-2 h-4 w-4 text-blue-500" />
                                Rol:
                            </label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                required
                            >
                                <option value="production">Operario</option>
                                <option value="admin">Administrador</option>
                            </select>                        </div>

                        {/* Sección de contraseña mejorada */}
                        {isEditing && !showPasswordFields ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Contraseña</p>
                                        <p className="text-xs text-gray-500">La contraseña actual se mantendrá sin cambios</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordFields(true)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        <Lock className="h-4 w-4" />
                                        Cambiar Contraseña
                                    </button>
                                </div>
                            </div>
                        ) : showPasswordFields ? (
                            <>
                                {isEditing && (
                                    <div className="flex items-center justify-between mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Info className="h-4 w-4 text-yellow-600" />
                                            <span className="text-sm font-medium text-yellow-800">Cambiar contraseña</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPasswordFields(false);
                                                setPassword('');
                                                setConfirmPassword('');
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.password;
                                                    delete newErrors.confirmPassword;
                                                    return newErrors;
                                                });
                                            }}
                                            className="text-sm text-yellow-700 hover:text-yellow-900 font-medium"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}

                                <div>                                    <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                        <Lock className="mr-2 h-4 w-4 text-blue-500" />
                                        {isEditing ? 'Nueva Contraseña:' : 'Contraseña:'}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                            required
                                            aria-invalid={errors.password ? "true" : "false"}
                                            aria-describedby="password-error"
                                        />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                    {errors.password && <p id="password-error" className="text-red-500 text-xs mt-1 flex items-center"><Info className="h-3 w-3 mr-1" />{errors.password}</p>}
                                </div>

                                <div>                                    <label htmlFor="confirmPassword" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                        <Lock className="mr-2 h-4 w-4 text-blue-500" />
                                        Confirmar {isEditing ? 'Nueva ' : ''}Contraseña:
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repite la contraseña"
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                            required
                                            aria-invalid={errors.confirmPassword ? "true" : "false"}
                                            aria-describedby="confirm-password-error"
                                        />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                    {errors.confirmPassword && <p id="confirm-password-error" className="text-red-500 text-xs mt-1 flex items-center"><Info className="h-3 w-3 mr-1" />{errors.confirmPassword}</p>}
                                </div>
                            </>
                        ) : null}

                        <div className="flex justify-end space-x-4 pt-4">
                            <Button
                                type="button"
                                onClick={onCancelar}
                                variant="outline"
                                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                                disabled={isLoading}
                            >
                                <XCircle className="h-4 w-4" />
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {isLoading ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
};

UsuarioForm.propTypes = {
    usuarioInicial: PropTypes.object,
    onGuardar: PropTypes.func.isRequired,
    onCancelar: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    showSuccessMessage: PropTypes.bool.isRequired,
    savedUserData: PropTypes.shape({
        nombre: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        role: PropTypes.string.isRequired,
        _id: PropTypes.string,
    }),
};

export default UsuarioForm;