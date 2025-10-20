import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Plus, Clock, LogOut, Lock, Edit } from 'lucide-react';

const SistemaGestion = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ usuario: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [clientes, setClientes] = useState([]);
  const [terapeutas, setTerapeutas] = useState([]);
  const [horasTrabajadas, setHorasTrabajadas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [modals, setModals] = useState({ horas: false, terapeuta: false, cliente: false, usuario: false, pago: false });
  const [editingId, setEditingId] = useState(null);
  
  const [horasForm, setHorasForm] = useState({ terapeutaId: '', clienteId: '', fecha: '', horas: '', codigoCliente: '', notas: '' });
  const [terapeutaForm, setTerapeutaForm] = useState({ nombre: '', especialidad: '', telefono: '', email: '' });
  const [clienteForm, setClienteForm] = useState({ nombre: '', email: '', telefono: '', empresa: '', codigo: '' });
  const [usuarioForm, setUsuarioForm] = useState({ nombre: '', usuario: '', password: '', rol: 'terapeuta', email: '' });
  const [pagoForm, setPagoForm] = useState({ clienteId: '', monto: '', concepto: '', metodo: 'efectivo', fecha: '' });

  useEffect(() => {
    setUsuarios([
      { id: 1, nombre: 'Admin Principal', usuario: 'admin', password: 'admin123', rol: 'admin' },
      { id: 2, nombre: 'Frida Kahlo', usuario: 'frida', password: 'frida123', rol: 'terapeuta' }
    ]);
    setClientes([
      { id: 1, nombre: 'John Smith', email: 'john@email.com', codigo: '061' },
      { id: 2, nombre: 'María García', email: 'maria@email.com', codigo: '062' }
    ]);
    setTerapeutas([
      { id: 1, nombre: 'Frida Kahlo', especialidad: 'Terapia Física' },
      { id: 2, nombre: 'Ana Martínez', especialidad: 'Terapia Ocupacional' }
    ]);
    setHorasTrabajadas([
      { id: 1, terapeutaId: 1, clienteId: 1, fecha: '2025-10-17', horas: 2, codigoCliente: '061', notas: 'Sesión' }
    ]);
    setPagos([{ id: 1, clienteId: 1, monto: 1500, concepto: 'Consultoría', fecha: '2025-10-15' }]);
  }, []);

  const handleLogin = () => {
    const user = usuarios.find(u => u.usuario === loginForm.usuario && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setLoginError('');
      setActiveTab(user.rol === 'terapeuta' ? 'horas' : 'dashboard');
    } else {
      setLoginError('Usuario o contraseña incorrectos');
    }
  };

  const hasPermission = (s) => {
    if (!currentUser) return false;
    const p = { admin: ['dashboard', 'terapeutas', 'horas', 'clientes', 'pagos', 'usuarios'], terapeuta: ['horas'], contador: ['dashboard', 'pagos', 'clientes'] };
    return p[currentUser.rol]?.includes(s) || false;
  };

  const openModal = (type, item = null) => {
    if (item) {
      if (type === 'horas') setHorasForm(item);
      else if (type === 'terapeuta') setTerapeutaForm(item);
      else if (type === 'cliente') setClienteForm(item);
      else if (type === 'usuario') setUsuarioForm(item);
      else if (type === 'pago') setPagoForm({ ...item, monto: item.monto.toString() });
      setEditingId(item.id);
    }
    setModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setModals(prev => ({ ...prev, [type]: false }));
    setEditingId(null);
    if (type === 'horas') setHorasForm({ terapeutaId: '', clienteId: '', fecha: '', horas: '', codigoCliente: '', notas: '' });
    else if (type === 'terapeuta') setTerapeutaForm({ nombre: '', especialidad: '', telefono: '', email: '' });
    else if (type === 'cliente') setClienteForm({ nombre: '', email: '', telefono: '', empresa: '', codigo: '' });
    else if (type === 'usuario') setUsuarioForm({ nombre: '', usuario: '', password: '', rol: 'terapeuta', email: '' });
    else if (type === 'pago') setPagoForm({ clienteId: '', monto: '', concepto: '', metodo: 'efectivo', fecha: '' });
  };

  const save = (type) => {
    if (type === 'horas') {
      const tid = currentUser.rol === 'terapeuta' ? terapeutas.find(t => t.nombre === currentUser.nombre)?.id : horasForm.terapeutaId;
      const data = { ...horasForm, terapeutaId: tid, horas: parseFloat(horasForm.horas) };
      setHorasTrabajadas(editingId ? horasTrabajadas.map(h => h.id === editingId ? { ...data, id: editingId } : h) : [...horasTrabajadas, { ...data, id: Date.now() }]);
    } else if (type === 'terapeuta') {
      setTerapeutas(editingId ? terapeutas.map(t => t.id === editingId ? { ...terapeutaForm, id: editingId } : t) : [...terapeutas, { ...terapeutaForm, id: Date.now() }]);
    } else if (type === 'cliente') {
      setClientes(editingId ? clientes.map(c => c.id === editingId ? { ...clienteForm, id: editingId } : c) : [...clientes, { ...clienteForm, id: Date.now() }]);
    } else if (type === 'usuario') {
      setUsuarios(editingId ? usuarios.map(u => u.id === editingId ? { ...usuarioForm, id: editingId } : u) : [...usuarios, { ...usuarioForm, id: Date.now() }]);
    } else if (type === 'pago') {
      const data = { ...pagoForm, monto: parseFloat(pagoForm.monto) };
      setPagos(editingId ? pagos.map(p => p.id === editingId ? { ...data, id: editingId } : p) : [...pagos, { ...data, id: Date.now() }]);
    }
    closeModal(type);
  };

  const getNombre = (id, arr) => arr.find(i => i.id === parseInt(id))?.nombre || 'N/A';

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-4"><Lock className="w-12 h-12 text-blue-600" /></div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Sistema de Gestión</h1>
          </div>
          <div className="space-y-6">
            <div><input type="text" className="w-full p-3 border rounded-lg" placeholder="Usuario" value={loginForm.usuario} onChange={(e) => setLoginForm({...loginForm, usuario: e.target.value})} /></div>
            <div><input type="password" className="w-full p-3 border rounded-lg" placeholder="Contraseña" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} /></div>
            {loginError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{loginError}</div>}
            <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium">Iniciar Sesión</button>
          </div>
          <div className="mt-8 pt-6 border-t"><p className="text-sm text-gray-600 mb-2"><strong>Admin:</strong> admin / admin123</p></div>
        </div>
      </div>
    );
  }

  const Modal = ({ show, title, children, onSave, onClose }) => {
    if (!show) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">{title}</h3>
          {children}
          <div className="flex justify-end space-x-2 mt-6">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
            <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editingId ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center"><DollarSign className="w-8 h-8 text-blue-600" /><h1 className="ml-2 text-2xl font-bold">Sistema de Gestión</h1></div>
            <div className="flex items-center space-x-4">
              <div className="text-right"><p className="text-sm font-medium">{currentUser.nombre}</p><p className="text-xs text-gray-500 capitalize">{currentUser.rol}</p></div>
              <button onClick={() => setIsLoggedIn(false)} className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"><LogOut className="w-4 h-4" /><span>Salir</span></button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {[{ id: 'dashboard', label: 'Dashboard', icon: DollarSign }, { id: 'terapeutas', label: 'Terapeutas', icon: Users }, { id: 'horas', label: 'Horas', icon: Clock }, { id: 'clientes', label: 'Clientes', icon: Users }, { id: 'pagos', label: 'Pagos', icon: DollarSign }, { id: 'usuarios', label: 'Usuarios', icon: Users }].filter(i => hasPermission(i.id)).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center px-3 py-4 text-sm font-medium whitespace-nowrap ${activeTab === id ? 'text-white border-b-2 border-white' : 'text-blue-200 hover:text-white'}`}><Icon className="w-4 h-4 mr-2" />{label}</button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {activeTab === 'dashboard' && hasPermission('dashboard') && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500"><p className="text-sm font-medium text-blue-600">Terapeutas</p><p className="text-2xl font-bold text-blue-800">{terapeutas.length}</p></div>
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500"><p className="text-sm font-medium text-green-600">Horas</p><p className="text-2xl font-bold text-green-800">{horasTrabajadas.reduce((s, h) => s + h.horas, 0).toFixed(1)}</p></div>
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500"><p className="text-sm font-medium text-purple-600">Clientes</p><p className="text-2xl font-bold text-purple-800">{clientes.length}</p></div>
              <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500"><p className="text-sm font-medium text-yellow-600">Ingresos</p><p className="text-2xl font-bold text-yellow-800">${pagos.reduce((s, p) => s + p.monto, 0).toLocaleString()}</p></div>
            </div>
          </div>
        )}

        {activeTab === 'terapeutas' && hasPermission('terapeutas') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Terapeutas</h2>
              <button onClick={() => openModal('terapeuta')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><Plus className="w-4 h-4 mr-2" />Nueva</button>
            </div>
            <div className="bg-white shadow rounded-md"><ul className="divide-y">{terapeutas.map(t => (<li key={t.id} className="px-6 py-4"><div className="flex justify-between items-center"><div><p className="font-medium">{t.nombre}</p><p className="text-sm text-gray-600">{t.especialidad}</p></div><button onClick={() => openModal('terapeuta', t)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button></div></li>))}</ul></div>
          </div>
        )}

        {activeTab === 'horas' && hasPermission('horas') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Horas</h2>
              <button onClick={() => openModal('horas')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"><Plus className="w-4 h-4 mr-2" />Registrar</button>
            </div>
            <div className="bg-white shadow rounded-md"><ul className="divide-y">{horasTrabajadas.filter(h => currentUser.rol === 'admin' || terapeutas.find(t => t.nombre === currentUser.nombre)?.id === h.terapeutaId).map(h => (<li key={h.id} className="px-6 py-4"><div className="flex justify-between"><div><p className="font-medium">{getNombre(h.terapeutaId, terapeutas)}</p><p className="text-sm text-gray-600">Cliente: {getNombre(h.clienteId, clientes)} ({h.codigoCliente})</p><p className="text-sm text-gray-600">{h.fecha}</p></div><div className="flex items-center space-x-4"><p className="text-2xl font-bold text-green-600">{h.horas}h</p><button onClick={() => openModal('horas', h)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button></div></div></li>))}</ul></div>
          </div>
        )}

        {activeTab === 'clientes' && hasPermission('clientes') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Clientes</h2>
              <button onClick={() => openModal('cliente')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><Plus className="w-4 h-4 mr-2" />Nuevo</button>
            </div>
            <div className="bg-white shadow rounded-md"><ul className="divide-y">{clientes.map(c => (<li key={c.id} className="px-6 py-4"><div className="flex justify-between items-center"><div><p className="font-medium">{c.nombre}</p><p className="text-sm text-gray-600">{c.email}</p><p className="text-sm text-blue-600">Código: {c.codigo}</p></div><button onClick={() => openModal('cliente', c)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button></div></li>))}</ul></div>
          </div>
        )}

        {activeTab === 'pagos' && hasPermission('pagos') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Pagos</h2>
              <button onClick={() => openModal('pago')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"><Plus className="w-4 h-4 mr-2" />Registrar</button>
            </div>
            <div className="bg-white shadow rounded-md"><ul className="divide-y">{pagos.map(p => (<li key={p.id} className="px-6 py-4"><div className="flex justify-between items-center"><div><p className="font-medium">{getNombre(p.clienteId, clientes)}</p><p className="text-sm text-gray-600">{p.concepto}</p></div><div className="flex items-center space-x-4"><p className="text-xl font-bold text-green-600">${p.monto.toLocaleString()}</p><button onClick={() => openModal('pago', p)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button></div></div></li>))}</ul></div>
          </div>
        )}

        {activeTab === 'usuarios' && hasPermission('usuarios') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Usuarios</h2>
              <button onClick={() => openModal('usuario')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><Plus className="w-4 h-4 mr-2" />Nuevo</button>
            </div>
            <div className="bg-white shadow rounded-md"><ul className="divide-y">{usuarios.map(u => (<li key={u.id} className="px-6 py-4"><div className="flex justify-between items-center"><div><p className="font-medium">{u.nombre}</p><p className="text-sm text-gray-600">Usuario: {u.usuario}</p><p className="text-sm text-blue-600 capitalize">Rol: {u.rol}</p></div><button onClick={() => openModal('usuario', u)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button></div></li>))}</ul></div>
          </div>
        )}
      </main>

      {modals.horas && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar Horas' : 'Registrar Horas'}</h3>
            <div className="space-y-4">
              {currentUser.rol === 'admin' && <select className="w-full p-2 border rounded" value={horasForm.terapeutaId} onChange={(e) => setHorasForm({...horasForm, terapeutaId: e.target.value})}><option value="">Seleccionar terapeuta</option>{terapeutas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select>}
              <select className="w-full p-2 border rounded" value={horasForm.clienteId} onChange={(e) => { const c = clientes.find(cl => cl.id === parseInt(e.target.value)); setHorasForm({...horasForm, clienteId: e.target.value, codigoCliente: c?.codigo || ''}); }}><option value="">Seleccionar cliente</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.codigo})</option>)}</select>
              <input type="date" className="w-full p-2 border rounded" value={horasForm.fecha} onChange={(e) => setHorasForm({...horasForm, fecha: e.target.value})} />
              <input type="number" step="0.5" placeholder="Horas" className="w-full p-2 border rounded" value={horasForm.horas} onChange={(e) => setHorasForm({...horasForm, horas: e.target.value})} />
              <textarea placeholder="Notas" className="w-full p-2 border rounded" value={horasForm.notas} onChange={(e) => setHorasForm({...horasForm, notas: e.target.value})} rows="3" />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => closeModal('horas')} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={() => save('horas')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{editingId ? 'Actualizar' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {modals.terapeuta && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar Terapeuta' : 'Nueva Terapeuta'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" className="w-full p-2 border rounded" value={terapeutaForm.nombre} onChange={(e) => setTerapeutaForm({...terapeutaForm, nombre: e.target.value})} />
              <input type="text" placeholder="Especialidad" className="w-full p-2 border rounded" value={terapeutaForm.especialidad} onChange={(e) => setTerapeutaForm({...terapeutaForm, especialidad: e.target.value})} />
              <input type="tel" placeholder="Teléfono" className="w-full p-2 border rounded" value={terapeutaForm.telefono} onChange={(e) => setTerapeutaForm({...terapeutaForm, telefono: e.target.value})} />
              <input type="email" placeholder="Email" className="w-full p-2 border rounded" value={terapeutaForm.email} onChange={(e) => setTerapeutaForm({...terapeutaForm, email: e.target.value})} />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => closeModal('terapeuta')} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={() => save('terapeuta')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editingId ? 'Actualizar' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {modals.cliente && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" className="w-full p-2 border rounded" value={clienteForm.nombre} onChange={(e) => setClienteForm({...clienteForm, nombre: e.target.value})} />
              <input type="email" placeholder="Email" className="w-full p-2 border rounded" value={clienteForm.email} onChange={(e) => setClienteForm({...clienteForm, email: e.target.value})} />
              <input type="tel" placeholder="Teléfono" className="w-full p-2 border rounded" value={clienteForm.telefono} onChange={(e) => setClienteForm({...clienteForm, telefono: e.target.value})} />
              <input type="text" placeholder="Empresa" className="w-full p-2 border rounded" value={clienteForm.empresa} onChange={(e) => setClienteForm({...clienteForm, empresa: e.target.value})} />
              <input type="text" placeholder="Código" className="w-full p-2 border rounded" value={clienteForm.codigo} onChange={(e) => setClienteForm({...clienteForm, codigo: e.target.value})} />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => closeModal('cliente')} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={() => save('cliente')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editingId ? 'Actualizar' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {modals.usuario && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" className="w-full p-2 border rounded" value={usuarioForm.nombre} onChange={(e) => setUsuarioForm({...usuarioForm, nombre: e.target.value})} />
              <input type="text" placeholder="Usuario" className="w-full p-2 border rounded" value={usuarioForm.usuario} onChange={(e) => setUsuarioForm({...usuarioForm, usuario: e.target.value})} />
              <input type="password" placeholder="Contraseña" className="w-full p-2 border rounded" value={usuarioForm.password} onChange={(e) => setUsuarioForm({...usuarioForm, password: e.target.value})} />
              <input type="email" placeholder="Email" className="w-full p-2 border rounded" value={usuarioForm.email} onChange={(e) => setUsuarioForm({...usuarioForm, email: e.target.value})} />
              <select className="w-full p-2 border rounded" value={usuarioForm.rol} onChange={(e) => setUsuarioForm({...usuarioForm, rol: e.target.value})}><option value="terapeuta">Terapeuta</option><option value="contador">Contador</option><option value="admin">Admin</option></select>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => closeModal('usuario')} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={() => save('usuario')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editingId ? 'Actualizar' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {modals.pago && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar Pago' : 'Registrar Pago'}</h3>
            <div className="space-y-4">
              <select className="w-full p-2 border rounded" value={pagoForm.clienteId} onChange={(e) => setPagoForm({...pagoForm, clienteId: e.target.value})}><option value="">Seleccionar cliente</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
              <input type="number" placeholder="Monto" className="w-full p-2 border rounded" value={pagoForm.monto} onChange={(e) => setPagoForm({...pagoForm, monto: e.target.value})} />
              <input type="text" placeholder="Concepto" className="w-full p-2 border rounded" value={pagoForm.concepto} onChange={(e) => setPagoForm({...pagoForm, concepto: e.target.value})} />
              <select className="w-full p-2 border rounded" value={pagoForm.metodo} onChange={(e) => setPagoForm({...pagoForm, metodo: e.target.value})}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option></select>
              <input type="date" className="w-full p-2 border rounded" value={pagoForm.fecha} onChange={(e) => setPagoForm({...pagoForm, fecha: e.target.value})} />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => closeModal('pago')} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={() => save('pago')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{editingId ? 'Actualizar' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SistemaGestion;