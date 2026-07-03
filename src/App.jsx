
import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Calendar, User, RefreshCw } from 'lucide-react';

// ⚠️ REEMPLAZÁ CON TUS DATOS DE JSONBIN REALES:
const BIN_ID = "6a4729b9da38895dfe2604a3"; 
const API_KEY = "$2a$10$hyj.2AMWWWJjShktZGJ5Z.H0/lon/J.r8qKUouHauGL4GxFnX52WG"; 

export default function App() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monto, setMonto] = useState('');
  const [detalle, setDetalle] = useState('');
  const [tipo, setTipo] = useState('gasto');
  const [estado, setEstado] = useState('Pendiente');
  const [usuarioActual, setUsuarioActual] = useState('Maximiliano');
  const [filtroMes, setFiltroMes] = useState('');

  // Traer los datos desde la nube de forma remota
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 'X-Master-Key': API_KEY }
      });
      const data = await res.json();
      
      // Accedemos a la propiedad .movimientos dentro del registro de JSONBin
      if (data.record && data.record.movimientos) {
        setMovimientos(data.record.movimientos);
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

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!monto || !detalle) return alert('Por favor completa los campos');

    const nuevo = {
      id: Date.now().toString(),
      monto: parseFloat(monto),
      detalle, 
      tipo, 
      estado,
      fecha: new Date().toISOString().split('T')[0],
      historialCambios: [{ usuario: usuarioActual, fechaCambio: new Date().toISOString().split('T')[0] }]
    };

    const listaActualizada = [nuevo, ...movimientos];
    setMovimientos(listaActualizada);
    setMonto(''); 
    setDetalle('');

    // Sincronizar en la nube manteniendo el formato del objeto
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify({ movimientos: listaActualizada })
      });
    } catch (err) {
      alert("Error al guardar en la nube");
      cargarDatos();
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    const listaActualizada = movimientos.map(m => m.id === id ? {
      ...m, 
      estado: nuevoEstado,
      historialCambios: [...m.historialCambios, { usuario: usuarioActual, fechaCambio: new Date().toISOString().split('T')[0] }]
    } : m);

    setMovimientos(listaActualizada);

    try {
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify({ movimientos: listaActualizada })
      });
    } catch (err) {
      alert("Error al actualizar el estado");
      cargarDatos();
    }
  };

  const getEstadoBadge = (est) => {
    if (est === 'Pagado') return 'bg-green-100 text-green-800 border border-green-300';
    if (est === 'Pendiente') return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    return 'bg-blue-100 text-blue-800 border border-blue-300'; // En revisión
  };

  return (
    <div class="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div class="max-w-5xl mx-auto">
        <div class="bg-white shadow-sm rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Control de Gastos y Pagos</h1>
            <p class="text-sm text-gray-500 mt-1">Sincronizado en la nube (Costo $0)</p>
          </div>
          <div class="mt-4 md:mt-0 flex items-center gap-2">
            <button onClick={cargarDatos} class="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300">
              <RefreshCw class={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div class="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-300">
              <span class="text-sm font-medium text-gray-600 mr-2">Operando como:</span>
              <select value={usuarioActual} onChange={(e) => setUsuarioActual(e.target.value)} class="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-semibold text-gray-700">
                <option value="Maximiliano">Maximiliano</option>
                <option value="Débora">Débora</option>
              </select>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de ingreso */}
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><PlusCircle class="w-5 h-5 text-indigo-600" /> Nuevo Registro</h2>
            <form onSubmit={handleAgregar} class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">Monto ($)</label>
                <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej: 25000" class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">Detalle / Descripción</label>
                <input type="text" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Ej: Supermercado" class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">Tipo</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} class="w-full border border-gray-300 rounded-lg p-2 text-sm">
                    <option value="gasto">Gasto</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">Estado</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value)} class="w-full border border-gray-300 rounded-lg p-2 text-sm">
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="En revisión">En revisión</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:bg-gray-400">
                {loading ? 'Sincronizando...' : 'Agregar Registro'}
              </button>
            </form>
          </div>

          {/* Buscador e Historial */}
          <div class="lg:col-span-2 space-y-4">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm text-gray-600"><Search class="w-4 h-4 text-gray-400" /> <span>Filtrar por Mes:</span></div>
              <input type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} class="border border-gray-300 rounded-lg p-1.5 text-sm text-gray-700" />
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 class="font-semibold text-gray-800">Historial de Operaciones</h3>
                {loading && <span class="text-xs text-indigo-600 animate-pulse">Cargando...</span>}
              </div>
              <div class="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {movimientos.filter(m => !filtroMes || m.fecha.startsWith(filtroMes)).length === 0 ? (
                  <div class="p-8 text-center text-gray-500 text-sm">No hay registros cargados para los filtros seleccionados.</div>
                ) : (
                  movimientos.filter(m => !filtroMes || m.fecha.startsWith(filtroMes)).map((m) => {
                    const ult = m.historialCambios && m.historialCambios.length > 0 ? m.historialCambios[m.historialCambios.length - 1] : { usuario: 'Sistema', fechaCambio: m.fecha };
                    return (
                      <div key={m.id} class="p-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div class="space-y-1">
                          <div class="flex items-center gap-2">
                            <span class={`px-2 py-0.5 text-xs font-semibold rounded ${m.tipo === 'gasto' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>{m.tipo.toUpperCase()}</span>
                            <span class="text-sm font-bold text-gray-900">${m.monto.toLocaleString('es-AR')}</span>
                          </div>
                          <p class="text-sm text-gray-700 font-medium">{m.detalle}</p>
                          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
                            <span class="flex items-center gap-1"><Calendar class="w-3 h-3" /> {m.fecha}</span>
                            <span class="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Modificado por {ult.usuario} ({ult.fechaCambio})</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class={`px-2.5 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(m.estado)}`}>{m.estado}</span>
                          <select value={m.estado} onChange={(e) => handleCambiarEstado(m.id, e.target.value)} class="border border-gray-300 bg-white rounded p-1 text-xs text-gray-600">
                            <option value="Pendiente">Pendiente</option>
                            <option value="Pagado">Pagado</option>
                            <option value="En revisión">En revisión</option>
                          </select>
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