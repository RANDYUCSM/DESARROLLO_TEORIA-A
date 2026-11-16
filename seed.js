import mongoose from 'mongoose';
import { conectarDB } from '../src/config/database.js';
import { Producto } from '../src/models/producto.js';
import { Usuario } from '../src/models/usuario.js';
import { comprobar, email, password } from '../src/middleware/validar.js';
import { crearHash } from '../src/services/password.js';

const catalogoInicial = [
  {
    sku: 'SV-P075', nombre: 'Portal de Sillar', categoria: 'piedra', taller: 'Taller Quebrada Blanca',
    descripcion: 'Miniatura tallada de un portal arequipeño en piedra volcánica.',
    precioCentimos: 4500, stock: 18,
  },
  {
    sku: 'SV-T140', nombre: 'Camino de Mesa Chili', categoria: 'textil', taller: 'Telar de la Ribera',
    descripcion: 'Camino de mesa tejido en algodón con motivos del río Chili.',
    precioCentimos: 6900, stock: 12,
  },
  {
    sku: 'SV-C210', nombre: 'Taza Niebla del Misti', categoria: 'ceramica', taller: 'Barro del Sur',
    descripcion: 'Taza de cerámica esmaltada con relieve del volcán Misti.',
    precioCentimos: 3800, stock: 22,
  },
  {
    sku: 'SV-L004', nombre: 'Bitácora de Yanahuara', categoria: 'papeleria', taller: 'Papel de los Arcos',
    descripcion: 'Libreta de hojas lisas con portada ilustrada de los arcos.',
    precioCentimos: 2800, stock: 30,
  },
];

try {
  const correo = comprobar(email, process.env.ADMIN_EMAIL);
  const clave = comprobar(password, process.env.ADMIN_PASSWORD);
  await conectarDB();

  const ahora = new Date();
  const admin = await Usuario.findOneAndUpdate({ email: correo }, {
    $setOnInsert: {
      nombre: 'Administración Sillar Vivo', email: correo,
      rol: 'admin', passwordHash: await crearHash(clave), createdAt: ahora, updatedAt: ahora,
    },
  }, { upsert: true, returnDocument: 'after', runValidators: true, timestamps: false });

  if (admin.rol !== 'admin') {
    throw new Error('ADMIN_EMAIL ya pertenece a un cliente. Elige otro correo para el administrador.');
  }
  // Conserva el catálogo existente y sus ajustes de inventario al repetir la carga.
  for (const producto of catalogoInicial) {
    await Producto.updateOne({ sku: producto.sku }, { $setOnInsert: { ...producto, createdAt: ahora, updatedAt: ahora } }, {
      upsert: true, runValidators: true, timestamps: false, overwriteImmutable: true,
    });
  }

  console.log('Administrador disponible y catálogo inicial cargado.');
} catch (error) {
  console.error('No se pudo cargar el catálogo:', error.message, error.detalles ?? '');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
