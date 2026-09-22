const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

const USUARIOS_PATH = path.join(__dirname, 'usuarios.json');
const PRODUCTOS_PATH = path.join(__dirname, 'productos.json');
const VENTAS_PATH = path.join(__dirname, 'ventas.json');

function leerJSON(ruta) {
  return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
}

function escribirJSON(ruta, datos) {
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 4), 'utf-8');
}

// PRODUCTOS

app.get('/productos', (req, res) => {
  res.json(leerJSON(PRODUCTOS_PATH));
});

app.get('/productos/:id', (req, res) => {
  const productos = leerJSON(PRODUCTOS_PATH);
  const producto = productos.find(p => p.id_producto === Number(req.params.id));
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
});

app.post('/productos', (req, res) => {
  const productos = leerJSON(PRODUCTOS_PATH);
  const { nombre, descripcion, precio, imagen, categoria } = req.body;

  if (!nombre || !precio) {
    return res.status(400).json({ error: 'Faltan datos obligatorios (nombre, precio)' });
  }

  const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id_producto)) + 1 : 1;
  const nuevoProducto = { id_producto: nuevoId, nombre, descripcion: descripcion || '', precio, imagen: imagen || '', categoria: categoria || '' };

  productos.push(nuevoProducto);
  escribirJSON(PRODUCTOS_PATH, productos);
  res.status(201).json(nuevoProducto);
});

app.put('/productos/:id', (req, res) => {
  const productos = leerJSON(PRODUCTOS_PATH);
  const id = Number(req.params.id);
  const index = productos.findIndex(p => p.id_producto === id);
  if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });

  productos[index] = { ...productos[index], ...req.body, id_producto: id };
  escribirJSON(PRODUCTOS_PATH, productos);
  res.json(productos[index]);
});

app.delete('/productos/:id', (req, res) => {
  const productos = leerJSON(PRODUCTOS_PATH);
  const ventas = leerJSON(VENTAS_PATH);
  const id = Number(req.params.id);

  if (!productos.some(p => p.id_producto === id)) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  // No se borra si el producto está en alguna venta, para no dejar referencias rotas
  const enUsoEnVentas = ventas.some(v => v.productos.some(p => p.id_producto === id));
  if (enUsoEnVentas) {
    return res.status(409).json({ error: 'No se puede eliminar: el producto está asociado a una o más ventas' });
  }

  escribirJSON(PRODUCTOS_PATH, productos.filter(p => p.id_producto !== id));
  res.json({ mensaje: 'Producto eliminado correctamente' });
});

// USUARIOS

app.get('/usuarios', (req, res) => {
  res.json(leerJSON(USUARIOS_PATH));
});

app.get('/usuarios/:id', (req, res) => {
  const usuarios = leerJSON(USUARIOS_PATH);
  const usuario = usuarios.find(u => u.id_usuario === Number(req.params.id));
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
});

app.post('/usuarios', (req, res) => {
  const usuarios = leerJSON(USUARIOS_PATH);
  const { nombre, apellido, email, contraseña } = req.body;

  if (!nombre || !apellido || !email || !contraseña) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const nuevoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id_usuario)) + 1 : 1;
  const nuevoUsuario = { id_usuario: nuevoId, nombre, apellido, email, contraseña, activo: true, esAdmin: false };

  usuarios.push(nuevoUsuario);
  escribirJSON(USUARIOS_PATH, usuarios);
  res.status(201).json(nuevoUsuario);
});

app.put('/usuarios/:id', (req, res) => {
  const usuarios = leerJSON(USUARIOS_PATH);
  const id = Number(req.params.id);
  const index = usuarios.findIndex(u => u.id_usuario === id);
  if (index === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

  usuarios[index] = { ...usuarios[index], ...req.body, id_usuario: id };
  escribirJSON(USUARIOS_PATH, usuarios);
  res.json(usuarios[index]);
});

app.delete('/usuarios/:id', (req, res) => {
  const usuarios = leerJSON(USUARIOS_PATH);
  const ventas = leerJSON(VENTAS_PATH);
  const id = Number(req.params.id);

  if (!usuarios.some(u => u.id_usuario === id)) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Integridad: si el usuario tiene ventas asociadas no se borra, para no dejar ventas con un id_usuario inexistente
  const tieneVentas = ventas.some(v => v.id_usuario === id);
  if (tieneVentas) {
    return res.status(409).json({ error: 'No se puede eliminar: el usuario tiene ventas asociadas. Elimine o reasigne esas ventas primero.' });
  }

  escribirJSON(USUARIOS_PATH, usuarios.filter(u => u.id_usuario !== id));
  res.json({ mensaje: 'Usuario eliminado correctamente' });
});

// VENTAS

app.get('/ventas', (req, res) => {
  res.json(leerJSON(VENTAS_PATH));
});

app.get('/ventas/:id', (req, res) => {
  const ventas = leerJSON(VENTAS_PATH);
  const venta = ventas.find(v => v.id_venta === Number(req.params.id));
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  res.json(venta);
});

app.post('/ventas', (req, res) => {
  const ventas = leerJSON(VENTAS_PATH);
  const usuarios = leerJSON(USUARIOS_PATH);
  const { id_usuario, direccion, envioGratis, productos } = req.body;

  if (!id_usuario || !direccion || !productos || !Array.isArray(productos)) {
    return res.status(400).json({ error: 'Faltan datos obligatorios (id_usuario, direccion, productos)' });
  }

  if (!usuarios.some(u => u.id_usuario === id_usuario)) {
    return res.status(400).json({ error: 'El id_usuario indicado no existe' });
  }

  const total = productos.reduce((acc, p) => acc + (p.precioUnitario * p.cantidad), 0);
  const nuevoId = ventas.length > 0 ? Math.max(...ventas.map(v => v.id_venta)) + 1 : 1;
  const nuevaVenta = { id_venta: nuevoId, id_usuario, fecha: new Date().toISOString().split('T')[0], direccion, envioGratis: envioGratis || false, pagado: false, total, productos };

  ventas.push(nuevaVenta);
  escribirJSON(VENTAS_PATH, ventas);
  res.status(201).json(nuevaVenta);
});

app.put('/ventas/:id', (req, res) => {
  const ventas = leerJSON(VENTAS_PATH);
  const id = Number(req.params.id);
  const index = ventas.findIndex(v => v.id_venta === id);
  if (index === -1) return res.status(404).json({ error: 'Venta no encontrada' });

  ventas[index] = { ...ventas[index], ...req.body, id_venta: id };
  escribirJSON(VENTAS_PATH, ventas);
  res.json(ventas[index]);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
