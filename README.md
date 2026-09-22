# Aplicaciones Web 2. Tema: Json

## Alumno: Lopez Luis Mauro.

### Comentarios: Se crea 3 json relacionados para el tp solicitado

---

## 2° Etapa - Servidor Express

### Cómo correr el servidor

```
npm install
npm start
```

El servidor levanta en `http://localhost:3000`.

### Rutas disponibles

**Productos**
| Método | Ruta | Descripción |
|---|---|---|
| GET | /productos | Lista todos los productos |
| GET | /productos/:id | Devuelve un producto por id |
| POST | /productos | Crea un producto nuevo (body: nombre, descripcion, precio, imagen, categoria) |
| PUT | /productos/:id | Actualiza un producto existente |
| DELETE | /productos/:id | Elimina un producto. Si está asociado a alguna venta, devuelve error 409 (no se borra) |

**Usuarios**
| Método | Ruta | Descripción |
|---|---|---|
| GET | /usuarios | Lista todos los usuarios |
| GET | /usuarios/:id | Devuelve un usuario por id |
| POST | /usuarios | Crea un usuario nuevo (body: nombre, apellido, email, contraseña) |
| PUT | /usuarios/:id | Actualiza un usuario existente |
| DELETE | /usuarios/:id | Elimina un usuario. Si tiene ventas asociadas, devuelve error 409 (no se borra, para mantener la integridad de los datos) |

**Ventas**
| Método | Ruta | Descripción |
|---|---|---|
| GET | /ventas | Lista todas las ventas |
| GET | /ventas/:id | Devuelve una venta por id |
| POST | /ventas | Crea una venta nueva (body: id_usuario, direccion, envioGratis, productos) |
| PUT | /ventas/:id | Actualiza una venta existente (por ejemplo, marcarla como pagada) |

### Integridad de datos

Antes de eliminar un usuario o un producto, el servidor revisa si existen ventas relacionadas. Si las hay, no permite el borrado y devuelve un error 409 explicando que primero hay que eliminar o modificar esas ventas.
