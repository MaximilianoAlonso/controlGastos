import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Calendar, RefreshCw, Trash2, Pencil, XCircle } from 'lucide-react';

const BIN_ID = "6a472b03da38895dfe26084f"; 
const API_KEY = "$2a$10$UhahWGxcwBqBipKpcuxwjeBn9GjMMS9mA6HmwpMDJSnVBSFIdmvJK"; 

export default function App() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monto, setMonto] = useState('');
  const [detalle, setDetalle] = useState('');
  const [tipo, setTipo] = useState('gasto');
  const [estado, setEstado] = useState('Pendiente');
  const [usuarioActual, setUsuarioActual] = useState('Maximiliano');
  const [filtroMes, setFiltroMes] = useState('');
  
  const [editandoId, setEditandoId] = useState(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        method: 'GET',
        headers: { 
          'X-Master-Key': API_KEY,
          'X-Bin-Meta': 'false'
        }
      });
      const data = await res.json();
      
      if (data && data.movimientos) {
        setMovimientos(data.movimientos);
      } else if (Array.isArray(data)) {
        setMovimientos(data);
      } else {
        setMovimientos([]);
      }
    } catch (err) {
      console.error("Error al cargar datos remotos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const actualizarNube = async (nuevaLista) => {
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify({ movimientos: nuevaLista })
      });
    } catch (err) {
      console.error("Error al sincronizar con la nube:", err);
      alert("Error al guardar en la nube. Intenta actualizar manualmente.");
    }
  };

  const handleAgregarOEditar = async (e) => {
    e.preventDefault();
    if (!monto || !detalle) return alert('Por favor completa los campos');

    let listaActualizada;
    const estadoFinal = tipo === 'pago' ? 'Pagado' : estado;

    if (editandoId) {
      listaActualizada = movimientos.map(m => {
        if (m.id === editandoId) {
          const cambiosPrevios = m.historialCambios || [];
          return {
            ...m,
            monto: parseFloat(monto),
            detalle,
            tipo,
            estado: estadoFinal,
            historialCambios: [...cambiosPrevios, { usuario: usuarioActual, fechaCambio: new Date().toISOString().split('T')[0] }]
          };
        }
        return m;
      });
      setEditandoId(null);
    } else {
      const nuevo = {
        id: Date.now().toString(),
        monto: parseFloat(monto),
        detalle, 
        tipo, 
        estado: estadoFinal,
        fecha: new Date().toISOString().split('T')[0],
        historialCambios: [{ usuario: usuarioActual, fechaCambio: new Date().toISOString().split('T')[0] }]
      };
      listaActualizada = [nuevo, ...movimientos];
    }

    setMovimientos(listaActualizada);
    setMonto(''); 
    setDetalle('');
    setTipo('gasto');
    setEstado('Pendiente');

    await actualizarNube(listaActualizada);
  };

  const handleIniciarEdicion = (mov) => {
    setEditandoId(mov.id);
    setMonto(mov.monto);
    setDetalle(mov.detalle);
    setTipo(mov.tipo);
    setEstado(mov.estado);
  };

  const handleCancelarEdicion = () => {
    setEditandoId(null);
    setMonto('');
    setDetalle('');
    setTipo('gasto');
    setEstado('Pendiente');
  };

  const handleBorrar = async (id) => {
    if (!confirm('¿Estás seguro de que querés borrar este registro?')) return;

    const listaActualizada = movimientos.filter(m => m.id !== id);
    setMovimientos(listaActualizada);

    if (editandoId === id) {
      handleCancelarEdicion();
    }

    await actualizarNube(listaActualizada);
  };

  const handleCambiarEstadoRapido = async (id, nuevoEstado) => {
    const listaActualizada = movimientos.map(m => m.id === id ? {
      ...m, 
      estado: nuevoEstado,
      historialCambios: [...(m.historialCambios || []), { usuario: usuarioActual, fechaCambio: new Date().toISOString().split('T')[0] }]
    } : m);

    setMovimientos(listaActualizada);
    await actualizarNube(listaActualizada);
  };

  const getEstadoBadge = (est) => {
    if (est === 'Pagado') return 'bg-green-100 text-green-800 border border-green-300';
    if (est === 'Pendiente') return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    return 'bg-blue-100 text-blue-800 border border-blue-300';
  };

  const getUserColorClass = (user) => {
    return user === 'Débora' ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  useEffect(() => {
    if (tipo === 'pago') {
      setEstado('Pagado');
    }
  }, [tipo]);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-sm rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Control de Gastos y Pagos</h1>
            <p className="text-sm text-gray-500 mt-1">Sincronizado en la nube (Costo $0)</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <button onClick={cargarDatos} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300">
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-300">
              <span className="text-sm font-medium text-gray-600 mr-2">Operando como:</span>
              <select 
                value={usuarioActual} 
                onChange={(e) => setUsuarioActual(e.target.value)} 
                className={`bg-white border rounded px-2 py-1 text-sm font-bold focus:outline-none ring-2 ${usuarioActual === 'Débora' ? 'text-purple-700 border-purple-300 ring-purple-100' : 'text-emerald-700 border-emerald-300 ring-emerald-100'}`}
              >
                <option value="Maximiliano" className="text-emerald-700 font-bold">Maximiliano</option>
                <option value="Débora" className="text-purple-700 font-bold">Débora</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PlusCircle className={`w-5 h-5 ${editandoId ? 'text-amber-500' : 'text-indigo-600'}`} /> 
              {editandoId ? 'Modificar Registro' : 'Nuevo Registro'}
            </h2>
            <form onSubmit={handleAgregarOEditar} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">Monto ($)</label>
                <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej: 25000" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">Detalle / Descripción</label>
                <input type="text" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Ej: Supermercado" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">Tipo</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm">
                    <option value="gasto">Gasto</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">Estado</label>
                  <select 
                    value={estado} 
                    onChange={(e) => setEstado(e.target.value)} 
                    disabled={tipo === 'pago'}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="En revisión">En revisión</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <button type="submit" disabled={loading} className={`w-full text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:bg-gray-400 ${editandoId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {loading ? 'Sincronizando...' : editandoId ? 'Guardar Cambios' : 'Agregar Registro'}
                </button>
                {editandoId && (
                  <button type="button" onClick={handleCancelarEdicion} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors border border-gray-300 flex items-center justify-center gap-1">
                    <XCircle className="w-4 h-4" /> Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600"><Search className="w-4 h-4 text-gray-400" /> <span>Filtrar por Mes:</span></div>
              <input type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="border border-gray-300 rounded-lg p-1.5 text-sm text-gray-700" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Historial de Operaciones</h3>
                {loading && <span className="text-xs text-indigo-600 animate-pulse">Cargando...</span>}
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {movimientos.filter(m => !filtroMes || m.fecha.startsWith(filtroMes)).length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">No hay registros cargados para los filtros seleccionados.</div>
                ) : (
                  movimientos.filter(m => !filtroMes || m.fecha.startsWith(filtroMes)).map((m) => {
                    const tieneModificaciones = m.historialCambios && m.historialCambios.length > 1;
                    const ult = m.historialCambios && m.historialCambios.length > 0 
                      ? m.historialCambios[m.historialCambios.length - 1] 
                      : { usuario: 'Sistema', fechaCambio: m.fecha };
                    
                    const esGastoPagado = m.tipo === 'gasto' && m.estado === 'Pagado';

                    return (
                      <div key={m.id} className={`p-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all ${esGastoPagado ? 'opacity-60 bg-gray-50' : ''}`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${m.tipo === 'gasto' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>{m.tipo.toUpperCase()}</span>
                            
                            <span className={`text-sm font-bold text-gray-900 ${esGastoPagado ? 'line-through text-gray-400' : ''}`}>
                              ${m.monto.toLocaleString('es-AR')}
                            </span>
                          </div>
                          
                          <p className={`text-sm font-medium text-gray-700 ${esGastoPagado ? 'line-through text-gray-400' : ''}`}>{m.detalle}</p>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.fecha}</span>
                            <span className={`px-1.5 py-0.5 rounded border text-[11px] font-medium ${getUserColorClass(ult.usuario)}`}>
                              {tieneModificaciones ? 'Modificado por ' : 'Agregado por '} {ult.usuario} ({ult.fechaCambio})
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-none pt-2 sm:pt-0">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleIniciarEdicion(m)} className="p-1.5 hover:bg-amber-50 rounded text-gray-400 hover:text-amber-600 transition-colors" title="Modificar todo el registro">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleBorrar(m.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors" title="Borrar registro">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(m.estado)}`}>
                              {m.estado}
                            </span>
                            
                            {/* Ahora apunta a handleCambiarEstadoRapido correctamente */}
                            {m.tipo === 'gasto' && (
                              <select 
                                value={m.estado} 
                                onChange={(e) => handleCambiarEstadoRapido(m.id, e.target.value)} 
                                className="border border-gray-300 bg-white rounded p-1 text-xs text-gray-600 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Pagado">Pagado</option>
                                <option value="En revisión">En revisión</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}