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
  AlertCircle,
  Shield,
  UserCog,
  Edit2
} from 'lucide-react';
import { crearUsuarioSistemaCloud, actualizarRolUsuarioCloud } from '../../api/cloudFunctions';

/**
 * Componente de Gestión de Usuarios del Portal y Sistema
 * Permite al admin crear y gestionar usuarios de clientes y usuarios del sistema
 */
const GestionUsuarios = ({
  clientes,
  usuarios = [],
  usuariosSistema = [],
  organizationId,
  onCrearUsuario,
  onActivarDesactivar,
  onResetPassword,
  onRecargarUsuarios
}) => {
  // const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [credencialesMostrar, setCredencialesMostrar] = useState(null);

  // Pestaña activa: 'portal' o 'sistema'
  const [tabActiva, setTabActiva] = useState('portal');

  // Form nuevo usuario portal (cliente)
  const [nuevoUsuario, setNuevoUsuario] = useState({
    clienteId: '',
    email: '',
    password: '',
    generarPasswordAuto: true
  });

  // Modal y form para usuarios del sistema
  const [mostrarModalSistema, setMostrarModalSistema] = useState(false);
  const [nuevoUsuarioSistema, setNuevoUsuarioSistema] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'asistente'
  });
  const [credencialesSistema, setCredencialesSistema] = useState(null);

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarPasswordSistema, setMostrarPasswordSistema] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Modal para editar rol de usuario del sistema
  const [mostrarModalEditarRol, setMostrarModalEditarRol] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [nuevoRolSeleccionado, setNuevoRolSeleccionado] = useState('');

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

  // ========== FUNCIONES PARA USUARIOS DEL SISTEMA ==========

  const handleAbrirModalSistema = () => {
    const passwordAuto = generarPasswordSegura();
    setNuevoUsuarioSistema({
      nombre: '',
      email: '',
      password: passwordAuto,
      rol: 'asistente'
    });
    setError('');
    setExito('');
    setCredencialesSistema(null);
    setMostrarModalSistema(true);
  };

  const handleCerrarModalSistema = () => {
    setMostrarModalSistema(false);
    setNuevoUsuarioSistema({
      nombre: '',
      email: '',
      password: '',
      rol: 'asistente'
    });
    setCredencialesSistema(null);
  };

  const handleCrearUsuarioSistema = async () => {
    setError('');
    setExito('');

    // Validaciones
    if (!nuevoUsuarioSistema.nombre) {
      setError('Ingresa el nombre del usuario');
      return;
    }

    if (!nuevoUsuarioSistema.email) {
      setError('Ingresa un email');
      return;
    }

    if (!validarEmail(nuevoUsuarioSistema.email)) {
      setError('Email inválido');
      return;
    }

    if (!nuevoUsuarioSistema.password || nuevoUsuarioSistema.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setLoading(true);

      const resultado = await crearUsuarioSistemaCloud({
        email: nuevoUsuarioSistema.email,
        password: nuevoUsuarioSistema.password,
        nombre: nuevoUsuarioSistema.nombre,
        rol: nuevoUsuarioSistema.rol,
        organizationId: organizationId
      });

      if (resultado.success) {
        setExito('¡Usuario del sistema creado exitosamente!');

        // Mostrar credenciales
        setCredencialesSistema({
          nombre: nuevoUsuarioSistema.nombre,
          email: nuevoUsuarioSistema.email,
          password: nuevoUsuarioSistema.password,
          rol: nuevoUsuarioSistema.rol
        });

        // Recargar usuarios si existe la función
        if (onRecargarUsuarios) {
          await onRecargarUsuarios();
        }
      } else {
        setError(resultado.error || 'Error al crear usuario del sistema');
      }
    } catch (err) {
      console.error('Error creando usuario del sistema:', err);
      setError(err.message || 'Error al crear usuario del sistema');
    } finally {
      setLoading(false);
    }
  };

  const getRolLabel = (rol) => {
    const roles = {
      admin: 'Administrador',
      asistente: 'Asistente Administrativo',
      terapeuta: 'Terapeuta'
    };
    return roles[rol] || rol;
  };

  const getRolColor = (rol) => {
    const colores = {
      admin: 'bg-purple-100 text-purple-800',
      asistente: 'bg-blue-100 text-blue-800',
      terapeuta: 'bg-green-100 text-green-800'
    };
    return colores[rol] || 'bg-gray-100 text-gray-800';
  };

  // ========== FUNCIONES PARA EDITAR ROL ==========

  const handleAbrirModalEditarRol = (usuario) => {
    setUsuarioEditando(usuario);
    setNuevoRolSeleccionado(usuario.rol);
    setError('');
    setExito('');
    setMostrarModalEditarRol(true);
  };

  const handleCerrarModalEditarRol = () => {
    setMostrarModalEditarRol(false);
    setUsuarioEditando(null);
    setNuevoRolSeleccionado('');
  };

  const handleGuardarRol = async () => {
    if (!usuarioEditando || !nuevoRolSeleccionado) return;

    if (nuevoRolSeleccionado === usuarioEditando.rol) {
      setError('Selecciona un rol diferente al actual');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const resultado = await actualizarRolUsuarioCloud(usuarioEditando.id, nuevoRolSeleccionado);

      if (resultado.success) {
        setExito(`Rol de ${usuarioEditando.nombre} actualizado a ${getRolLabel(nuevoRolSeleccionado)}`);

        // Recargar usuarios
        if (onRecargarUsuarios) {
          await onRecargarUsuarios();
        }

        // Cerrar modal después de un momento
        setTimeout(() => {
          handleCerrarModalEditarRol();
          setExito('');
        }, 1500);
      } else {
        setError(resultado.error || 'Error al actualizar rol');
      }
    } catch (err) {
      console.error('Error actualizando rol:', err);
      setError(err.message || 'Error al actualizar rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={28} />
            Gestión de Usuarios
          </h2>
          <p className="text-gray-600 mt-1">
            Administra accesos al sistema y portal de clientes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setTabActiva('portal')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            tabActiva === 'portal'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} />
            Usuarios del Portal
          </div>
        </button>
        <button
          onClick={() => setTabActiva('sistema')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            tabActiva === 'sistema'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield size={18} />
            Usuarios del Sistema
          </div>
        </button>
      </div>

      {/* Contenido según tab activa */}
      {tabActiva === 'portal' ? (
        <>
          {/* Botón crear usuario portal */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAbrirModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Crear Usuario Portal
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
        </>
      ) : (
        /* ========== TAB: USUARIOS DEL SISTEMA ========== */
        <>
          {/* Botón crear usuario sistema */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAbrirModalSistema}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} />
              Crear Usuario del Sistema
            </button>
          </div>

          {/* Tabla de Usuarios del Sistema */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usuariosSistema.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <Shield size={48} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No hay usuarios del sistema</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Crea usuarios con rol de administrador o asistente
                        </p>
                      </td>
                    </tr>
                  ) : (
                    usuariosSistema.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <UserCog size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {usuario.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-gray-400" />
                            <span className="text-gray-600">{usuario.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRolColor(usuario.rol)}`}>
                            <Shield size={12} />
                            {getRolLabel(usuario.rol)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {usuario.activo !== false ? (
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
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAbrirModalEditarRol(usuario)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Cambiar rol"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => onActivarDesactivar(usuario.id, usuario.activo === false)}
                              className={`p-2 rounded-lg transition-colors ${
                                usuario.activo !== false
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={usuario.activo !== false ? 'Desactivar' : 'Activar'}
                            >
                              {usuario.activo !== false ? <UserX size={18} /> : <UserCheck size={18} />}
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

          {/* Modal de Editar Rol */}
          {mostrarModalEditarRol && usuarioEditando && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Edit2 size={24} />
                  Cambiar Rol de Usuario
                </h3>

                {/* Mensajes */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {exito && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">{exito}</p>
                  </div>
                )}

                {/* Info del usuario */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Usuario:</p>
                  <p className="font-semibold text-gray-900">{usuarioEditando.nombre}</p>
                  <p className="text-sm text-gray-500">{usuarioEditando.email}</p>
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">Rol actual: </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRolColor(usuarioEditando.rol)}`}>
                      {getRolLabel(usuarioEditando.rol)}
                    </span>
                  </div>
                </div>

                {/* Selector de nuevo rol */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuevo Rol
                  </label>
                  <select
                    value={nuevoRolSeleccionado}
                    onChange={(e) => setNuevoRolSeleccionado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="asistente">Asistente Administrativo</option>
                    <option value="admin">Administrador</option>
                    <option value="terapeuta">Terapeuta</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    {nuevoRolSeleccionado === 'asistente' && 'Acceso a todo el sistema excepto Dashboard y datos de utilidad/márgenes'}
                    {nuevoRolSeleccionado === 'admin' && 'Acceso completo a todo el sistema'}
                    {nuevoRolSeleccionado === 'terapeuta' && 'Acceso limitado a horas, citas y reportes'}
                  </p>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCerrarModalEditarRol}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardarRol}
                    disabled={loading || nuevoRolSeleccionado === usuarioEditando.rol}
                    className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
                      loading || nuevoRolSeleccionado === usuarioEditando.rol
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Guardar Cambio
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Crear Usuario del Sistema */}
          {mostrarModalSistema && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield size={24} />
                  Crear Usuario del Sistema
                </h3>

                {/* Mensajes */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {exito && !credencialesSistema && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">{exito}</p>
                  </div>
                )}

                {/* Mostrar Credenciales */}
                {credencialesSistema ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                      <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                        <CheckCircle size={20} />
                        ¡Usuario del Sistema Creado!
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre:
                          </label>
                          <p className="text-gray-900 font-semibold">
                            {credencialesSistema.nombre}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rol:
                          </label>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRolColor(credencialesSistema.rol)}`}>
                            {getRolLabel(credencialesSistema.rol)}
                          </span>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email de acceso:
                          </label>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-900 font-mono bg-white px-3 py-2 rounded border flex-1">
                              {credencialesSistema.email}
                            </p>
                            <button
                              onClick={() => copiarAlPortapapeles(credencialesSistema.email)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Copy size={18} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña:
                          </label>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-900 font-mono bg-white px-3 py-2 rounded border flex-1">
                              {credencialesSistema.password}
                            </p>
                            <button
                              onClick={() => copiarAlPortapapeles(credencialesSistema.password)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Copy size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-purple-800">
                            <strong>Acceso:</strong> Este usuario puede iniciar sesión en{' '}
                            <span className="font-mono">/login</span> con estas credenciales.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setCredencialesSistema(null);
                          setNuevoUsuarioSistema({
                            nombre: '',
                            email: '',
                            password: generarPasswordSegura(),
                            rol: 'asistente'
                          });
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Crear Otro Usuario
                      </button>
                      <button
                        onClick={handleCerrarModalSistema}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Formulario de Creación */
                  <div className="space-y-6">
                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={nuevoUsuarioSistema.nombre}
                        onChange={(e) => setNuevoUsuarioSistema({ ...nuevoUsuarioSistema, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Nombre del usuario"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email de acceso *
                      </label>
                      <input
                        type="email"
                        value={nuevoUsuarioSistema.email}
                        onChange={(e) => setNuevoUsuarioSistema({ ...nuevoUsuarioSistema, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="usuario@email.com"
                      />
                    </div>

                    {/* Rol */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rol *
                      </label>
                      <select
                        value={nuevoUsuarioSistema.rol}
                        onChange={(e) => setNuevoUsuarioSistema({ ...nuevoUsuarioSistema, rol: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="asistente">Asistente Administrativo</option>
                        <option value="admin">Administrador</option>
                        <option value="terapeuta">Terapeuta</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {nuevoUsuarioSistema.rol === 'asistente' && 'Acceso a todo el sistema excepto Dashboard y datos de utilidad/márgenes'}
                        {nuevoUsuarioSistema.rol === 'admin' && 'Acceso completo a todo el sistema'}
                        {nuevoUsuarioSistema.rol === 'terapeuta' && 'Acceso limitado a horas, citas y reportes'}
                      </p>
                    </div>

                    {/* Contraseña */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña *
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={mostrarPasswordSistema ? 'text' : 'password'}
                            value={nuevoUsuarioSistema.password}
                            onChange={(e) => setNuevoUsuarioSistema({ ...nuevoUsuarioSistema, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-10"
                            placeholder="Mínimo 8 caracteres"
                          />
                          <button
                            type="button"
                            onClick={() => setMostrarPasswordSistema(!mostrarPasswordSistema)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {mostrarPasswordSistema ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <button
                          onClick={() => setNuevoUsuarioSistema({ ...nuevoUsuarioSistema, password: generarPasswordSegura() })}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                          title="Generar nueva contraseña"
                        >
                          <Key size={18} />
                          Generar
                        </button>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button
                        onClick={handleCerrarModalSistema}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCrearUsuarioSistema}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
                          loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700'
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
        </>
      )}
    </div>
  );
};

export default GestionUsuarios;
