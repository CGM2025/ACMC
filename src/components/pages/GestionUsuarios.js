import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Key,
  Copy,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';

/**
 * Componente de Gestión de Usuarios del Portal
 * Permite al admin crear y gestionar usuarios de clientes
 */
const GestionUsuarios = ({ 
  clientes,
  usuarios = [],  // ← AGREGAR AQUÍ
  onCrearUsuario,
  onActivarDesactivar,
  onResetPassword
}) => {
  // const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [credencialesMostrar, setCredencialesMostrar] = useState(null);
  
  // Form nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    clienteId: '',
    email: '',
    password: '',
    generarPasswordAuto: true
  });

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Cargar usuarios existentes
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usuarios'); // Implementaremos esta función
      // Por ahora, simulamos datos
      // En producción, esto vendría de Firestore
      // setUsuarios([]);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const generarPasswordSegura = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleAbrirModal = () => {
    const passwordAuto = generarPasswordSegura();
    setNuevoUsuario({
      clienteId: '',
      email: '',
      password: passwordAuto,
      generarPasswordAuto: true
    });
    setError('');
    setExito('');
    setCredencialesMostrar(null);
    setMostrarModal(true);
  };

  const handleCerrarModal = () => {
    setMostrarModal(false);
    setNuevoUsuario({
      clienteId: '',
      email: '',
      password: '',
      generarPasswordAuto: true
    });
    setCredencialesMostrar(null);
  };

  const handleRegenerarPassword = () => {
    const nuevaPassword = generarPasswordSegura();
    setNuevoUsuario({
      ...nuevoUsuario,
      password: nuevaPassword
    });
  };

  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleCrearUsuario = async () => {
    setError('');
    setExito('');

    // Validaciones
    if (!nuevoUsuario.clienteId) {
      setError('Selecciona un cliente');
      return;
    }

    if (!nuevoUsuario.email) {
      setError('Ingresa un email');
      return;
    }

    if (!validarEmail(nuevoUsuario.email)) {
      setError('Email inválido');
      return;
    }

    if (!nuevoUsuario.password || nuevoUsuario.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setLoading(true);

      // Llamar a la función de creación
      const resultado = await onCrearUsuario({
        clienteId: nuevoUsuario.clienteId,
        email: nuevoUsuario.email,
        password: nuevoUsuario.password
      });

      if (resultado.success) {
        setExito('¡Usuario creado exitosamente!');
        
        // Mostrar credenciales
        setCredencialesMostrar({
          email: nuevoUsuario.email,
          password: nuevoUsuario.password,
          clienteNombre: clientes.find(c => c.id === nuevoUsuario.clienteId)?.nombre
        });

        // Recargar usuarios
        await cargarUsuarios();
      } else {
        setError(resultado.error || 'Error al crear usuario');
      }
    } catch (err) {
      console.error('Error creando usuario:', err);
      setError(err.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto);
    alert('Copiado al portapapeles');
  };

  const getClienteNombre = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={28} />
            Gestión de Usuarios del Portal
          </h2>
          <p className="text-gray-600 mt-1">
            Crea y administra accesos al portal de clientes
          </p>
        </div>
        <button
          onClick={handleAbrirModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Crear Usuario
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Users size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay usuarios creados</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Crea el primer usuario para darle acceso al portal
                    </p>
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {getClienteNombre(usuario.clienteId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-600">{usuario.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {usuario.activo ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={12} />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle size={12} />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(usuario.fechaCreacion).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onActivarDesactivar(usuario.id, !usuario.activo)}
                          className={`p-2 rounded-lg transition-colors ${
                            usuario.activo
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={usuario.activo ? 'Desactivar' : 'Activar'}
                        >
                          {usuario.activo ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button
                          onClick={() => onResetPassword(usuario.id, usuario.email)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Resetear contraseña"
                        >
                          <Key size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Crear Usuario */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Plus size={24} />
              Crear Usuario del Portal
            </h3>

            {/* Mensajes */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {exito && !credencialesMostrar && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{exito}</p>
              </div>
            )}

            {/* Mostrar Credenciales */}
            {credencialesMostrar ? (
              <div className="space-y-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <CheckCircle size={20} />
                    ¡Usuario Creado Exitosamente!
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente:
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {credencialesMostrar.clienteNombre}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email de acceso:
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900 font-mono bg-white px-3 py-2 rounded border flex-1">
                          {credencialesMostrar.email}
                        </p>
                        <button
                          onClick={() => copiarAlPortapapeles(credencialesMostrar.email)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña temporal:
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900 font-mono bg-white px-3 py-2 rounded border flex-1">
                          {credencialesMostrar.password}
                        </p>
                        <button
                          onClick={() => copiarAlPortapapeles(credencialesMostrar.password)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-blue-800">
                        <strong>⚠️ Importante:</strong> Envía estas credenciales al cliente de forma segura. 
                        El cliente podrá cambiar su contraseña después del primer login.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setCredencialesMostrar(null);
                      setNuevoUsuario({
                        clienteId: '',
                        email: '',
                        password: generarPasswordSegura(),
                        generarPasswordAuto: true
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Crear Otro Usuario
                  </button>
                  <button
                    onClick={handleCerrarModal}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              /* Formulario de Creación */
              <div className="space-y-6">
                {/* Seleccionar Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    value={nuevoUsuario.clienteId}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, clienteId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} {cliente.codigo ? `(${cliente.codigo})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de acceso *
                  </label>
                  <input
                    type="email"
                    value={nuevoUsuario.email}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="cliente@email.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este será el email que use el cliente para entrar al portal
                  </p>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña temporal *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={mostrarPassword ? 'text' : 'password'}
                        value={nuevoUsuario.password}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarPassword(!mostrarPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <button
                      onClick={handleRegenerarPassword}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                      title="Generar nueva contraseña"
                    >
                      <Key size={18} />
                      Generar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    El cliente podrá cambiarla en su primer acceso
                  </p>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={handleCerrarModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCrearUsuario}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Crear Usuario
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;
