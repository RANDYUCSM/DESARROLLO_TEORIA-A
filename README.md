# Sillar Vivo API

Backend de una tienda ficticia de artesanía arequipeña. El catálogo identifica el taller de origen de cada pieza y admite dos modalidades de entrega. El cliente puede solicitar un recojo con un código de seis dígitos o pedir reparto en uno de los distritos disponibles. Proyecto desarrollado en JavaScript con Node.js, Express, MongoDB, Mongoose y JWT.

## Instalación y arranque

Para el arranque local necesitas **Node.js 22.9 o superior**, npm y Docker con el complemento Compose. Como alternativa a Docker se puede usar un clúster MongoDB Atlas o una instalación de MongoDB configurada como replica set.

1. Descomprime el ZIP y abre una terminal dentro de la carpeta **sillar-vivo-api**. Instala las dependencias con el siguiente comando.

   ~~~bash
   npm ci
   ~~~

2. Copia **.env.example** a **.env**. En PowerShell usa «Copy-Item .env.example .env». En Bash usa «cp .env.example .env». Genera un secreto y pega el resultado en **JWT_SECRET**.

   ~~~bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ~~~

   Escribe una contraseña propia de al menos 10 caracteres en **ADMIN_PASSWORD**. **ADMIN_EMAIL** se usa para crear la cuenta administradora. Si usas Atlas, sustituye **MONGODB_URI** por la cadena de conexión de tu clúster con la base **sillar_vivo** y omite el comando de Docker del paso siguiente.

3. Inicia MongoDB, carga el catálogo inicial y arranca la API.

   ~~~bash
   docker compose up -d --wait
   npm run seed
   npm start
   ~~~

4. Abre [http://127.0.0.1:3000/api/salud](http://127.0.0.1:3000/api/salud). Debe devolver **200** con el estado **operativo**. **npm run dev** reinicia el servidor ante cambios en el código.

El archivo **compose.yaml** configura MongoDB con un replica set de un miembro para el entorno local. MongoDB debe admitir transacciones para descontar inventario y crear el pedido en una sola operación lógica. Repetir **npm run seed** conserva las existencias, los productos ya cargados y la contraseña registrada previamente. Puedes detener la base con **docker compose stop**.

## Cómo se aplica MVC

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Modelo | **src/models/** | Esquemas Mongoose de usuarios, productos y pedidos, junto con sus índices. |
| Vista | **src/views/** | Construye la representación JSON que recibe el cliente. |
| Controlador | **src/controllers/** | Atiende cada acción, invoca modelos o servicios y devuelve la vista. |

**src/routes/** conecta las rutas con sus controladores. **src/middleware/** valida solicitudes, autentica tokens, comprueba roles y traduce errores. **src/services/** contiene las reglas de inventario, pedidos, entrega y contraseñas. En una solicitud de compra, el controlador llama al servicio transaccional, el servicio guarda el pedido mediante los modelos y el controlador devuelve la vista JSON.

## Endpoints

La URL base es **http://127.0.0.1:3000/api**.

| Método | Ruta | Acceso | Operación |
|---|---|---|---|
| GET | /salud | Público | Comprueba la conexión con MongoDB. |
| POST | /auth/registro | Público | Crea una cuenta de cliente y devuelve un JWT. |
| POST | /auth/login | Público | Autentica y devuelve un JWT. |
| GET | /auth/perfil | Autenticado | Consulta el perfil propio. |
| GET | /productos | Público | Lista productos activos, con filtros y paginación. |
| GET | /productos/:id | Público | Consulta un producto activo. |
| POST | /productos | Admin | Crea un producto con SKU único y stock inicial. |
| PATCH | /productos/:id | Admin | Edita los datos del producto o lo reactiva con `activo: true`. |
| PATCH | /productos/:id/stock | Admin | Incrementa o reduce existencias con el campo **ajuste**. |
| DELETE | /productos/:id | Admin | Retira el producto del catálogo mediante baja lógica. |
| GET | /entregas | Público | Consulta distritos y tarifas de reparto. |
| POST | /pedidos | Autenticado | Crea un pedido. Requiere el encabezado **Idempotency-Key**. |
| GET | /pedidos | Autenticado | Lista pedidos propios. Admite filtro por estado. |
| GET | /pedidos/admin | Admin | Lista todos los pedidos. Admite filtro por estado. |
| GET | /pedidos/:id | Propietario o admin | Consulta el pedido. |
| PATCH | /pedidos/:id/cancelacion | Propietario | Cancela un pedido pendiente o en preparación. |
| PATCH | /pedidos/:id/estado | Admin | Cambia el estado del pedido. |

Las listas aceptan **pagina** y **limite**. Por defecto devuelven 12 elementos y el máximo por página es 50. En el catálogo puedes usar **q** para buscar por nombre, SKU o taller y **categoria** para filtrar por **piedra**, **textil**, **ceramica** o **papeleria**. En pedidos puedes filtrar por **estado**.

Las rutas privadas requieren el encabezado **Authorization: Bearer \<token\>**. El JWT vence a las dos horas. Las contraseñas se guardan mediante scrypt con una sal aleatoria y el registro asigna siempre el rol cliente.

## Prueba con Postman

Crea una variable de entorno **baseUrl** con **http://127.0.0.1:3000/api**. En solicitudes con cuerpo, selecciona **Body → raw → JSON**.

1. Registra un cliente con **POST {{baseUrl}}/auth/registro**. Guarda **data.token** como **tokenCliente**.

   ~~~json
   {
     "nombre": "Valeria Quispe",
     "email": "valeria@example.test",
     "password": "Valeria-De-Prueba-2026"
   }
   ~~~

2. Ejecuta **GET {{baseUrl}}/productos?categoria=piedra** y guarda el **id** de un producto como **productoId**.

3. Ejecuta **POST {{baseUrl}}/pedidos**. En **Authorization** elige **Bearer Token** e introduce **{{tokenCliente}}**. En **Headers**, agrega **Idempotency-Key** con el valor **prueba-recojo-001**. Guarda **data.id** como **pedidoId** y **data.codigoRecojo** como **codigoRecojo**.

   ~~~json
   {
     "items": [{ "productoId": "{{productoId}}", "cantidad": 2 }],
     "entrega": { "modalidad": "recojo" }
   }
   ~~~

   Espera **201**. Si repites la solicitud con la misma clave y los mismos datos recibirás **200** y el mismo pedido. Si cambias los datos con esa misma clave recibirás **409**. Genera una clave distinta para cada compra nueva.

4. Inicia sesión en **POST {{baseUrl}}/auth/login** con **email** y **password** del administrador que configuraste en **.env**. Guarda **data.token** como **tokenAdmin**. Usa ese token en las dos solicitudes **PATCH {{baseUrl}}/pedidos/{{pedidoId}}/estado**. Primero envía `{"estado":"preparando"}`. Luego confirma la entrega con el cuerpo de abajo.

   ~~~json
   {
     "estado": "entregado",
     "codigoRecojo": "{{codigoRecojo}}"
   }
   ~~~

   Para probar la cancelación, crea otro pedido y ejecuta **PATCH {{baseUrl}}/pedidos/{{pedidoId}}/cancelacion** con el token del propietario y el ID de ese nuevo pedido.

## Datos y reglas de negocio

Crea un producto con **POST /productos**, el token de administrador y un cuerpo como el siguiente.

~~~json
{
  "sku": "SV-C505",
  "nombre": "Taza Mirador",
  "descripcion": "Taza esmaltada con motivos del mirador de Yanahuara.",
  "categoria": "ceramica",
  "taller": "Taller Barro del Sur",
  "precioCentimos": 4290,
  "stock": 12
}
~~~

Puedes modificar el inventario con **PATCH /productos/:id/stock** y `{"ajuste":5}` para agregar cinco unidades o `{"ajuste":-3}` para retirar tres.

- Los importes se expresan en céntimos de sol. **4290** equivale a **S/ 42.90**. El servidor toma los precios del catálogo y conserva el precio unitario de cada ítem en el pedido.
- Para solicitar reparto, usa por ejemplo `{"modalidad":"reparto","distrito":"cayma","direccion":"Av. Bolognesi 123"}` en el campo **entrega**. Las tarifas del proyecto se consultan en **GET /entregas**.
- Al crear un pedido, la API descuenta el inventario con una transacción. Si un producto queda sin existencias antes de que se complete la compra, la solicitud devuelve **409** y la transacción revierte los descuentos parciales.
- El recorrido normal es **pendiente → preparando → entregado**. Tanto **pendiente** como **preparando** admiten cancelación. Cancelar devuelve las unidades al stock.
- El comprador puede consultar el código de recojo en el detalle de su pedido pendiente o en preparación. El administrador confirma el recojo introduciendo el código entregado por el comprador.
- El alcance del proyecto comprende catálogo, inventario, autenticación y pedidos. El estado **entregado** registra la entrega de un pedido.

Las respuestas exitosas usan **data**, y las listas añaden **meta**. Una baja exitosa devuelve **204**. Los errores usan **error.codigo**, **error.mensaje** y, cuando corresponde, **error.detalles**. Los códigos frecuentes son **400** (datos inválidos), **401** (autenticación), **403** (permisos), **404** (recurso inexistente o pedido ajeno), **409** (conflicto) y **429** (límite de intentos de autenticación).

## Pruebas automatizadas

Con MongoDB local en marcha, ejecuta **npm test**. Las pruebas abren un servidor HTTP temporal, crean una base con un nombre aleatorio y la eliminan al terminar. Si usas otra instancia de MongoDB de pruebas, especifica su URI con **MONGODB_TEST_URI** en **.env**. Ese usuario de MongoDB debe poder crear y eliminar bases de prueba.

La suite verifica permisos, catálogo, compra concurrente, reposición por cancelación, pedidos repetidos, validación de recojo, reparto y reversión ante inventario insuficiente.

## Referencias técnicas

- [Manejo de errores en Express](https://expressjs.com/en/5x/guide/error-handling/)
- [Transacciones en Mongoose](https://mongoosejs.com/docs/transactions.html)
- [Requisitos de las transacciones de MongoDB](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/)
- [Biblioteca jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
