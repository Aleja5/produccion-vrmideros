# 🛡️ GUÍA DE DESPLIEGUE SEGURO

## ✅ CHECKLIST DE SEGURIDAD PRE-PRODUCCIÓN

### 🔐 1. VARIABLES DE ENTORNO CRÍTICAS

**ANTES DE DESPLEGAR:**

```bash
# Ejecutar verificación de seguridad
cd backend && node verify-security.js
```

**CAMBIOS OBLIGATORIOS:**

- [ ] **Cambiar credenciales de MongoDB**
  - Crear nuevo usuario en MongoDB Atlas con permisos limitados
  - Actualizar `MONGO_URI` en `.env`
  - Restringir acceso IP en MongoDB Atlas

- [ ] **Verificar JWT_SECRET**
  - ✅ Ya configurado con 512 bits de seguridad
  - NO cambiar en producción (invalidaría sesiones)

- [ ] **Configurar NODE_ENV**
  ```env
  NODE_ENV=production
  ```

- [ ] **Configurar CORS para producción**
  ```env
  CORS_ORIGIN=https://tu-dominio.com,https://www.tu-dominio.com
  ```

### 🗄️ 2. CONFIGURACIÓN DE BASE DE DATOS

**Crear usuario específico en MongoDB Atlas:**

1. Ve a Database Access → Add New Database User
2. Configura estos permisos mínimos:
   ```json
   {
     "role": "readWrite",
     "db": "localproduccion"
   }
   ```
3. Actualiza MONGO_URI:
   ```env
   MONGO_URI=mongodb+srv://NUEVO_USUARIO:NUEVA_PASSWORD@cluster.mongodb.net/localproduccion?retryWrites=true&w=majority
   ```

### 🔧 3. CONFIGURACIÓN HTTPS

**Para despliegue en servidor con dominio:**

1. **Obtener certificados SSL:**
   ```bash
   # Con Let's Encrypt (gratis)
   sudo certbot --nginx -d tu-dominio.com
   ```

2. **Actualizar variables de entorno:**
   ```env
   HTTPS_ENABLED=true
   SSL_CERT_PATH=/path/to/certificate.crt
   SSL_KEY_PATH=/path/to/private.key
   ```

3. **Modificar server.js para HTTPS:**
   ```javascript
   const { createHttpsServer } = require('./src/config/https');
   
   // Crear servidor HTTPS si está configurado
   const httpsServer = createHttpsServer(app);
   if (httpsServer) {
       httpsServer.listen(443, () => {
           console.log('🔒 Servidor HTTPS corriendo en puerto 443');
       });
   }
   ```

### 🧹 4. LIMPIEZA DE LOGS

**EJECUTADO:** ✅ Logs sensibles eliminados de auth controllers

**PENDIENTE:** Revisar otros controladores
```bash
# Buscar logs restantes
grep -r "console.log" backend/src/ --include="*.js" | wc -l
```

### 🛡️ 5. CONFIGURACIONES ADICIONALES DE SEGURIDAD

**Implementar rate limiting:**
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de requests por IP
});

app.use('/api/', limiter);
```

### 🚀 6. DESPLIEGUE PASO A PASO

1. **Verificar seguridad:**
   ```bash
   cd backend && node verify-security.js
   ```

2. **Instalar dependencias:**
   ```bash
   npm install --production
   ```

3. **Construir frontend:**
   ```bash
   cd frontend && npm run build
   ```

4. **Configurar variables de entorno en servidor:**
   - Copiar `.env.example` a `.env`
   - Configurar todas las variables

5. **Ejecutar migraciones (si aplica):**
   ```bash
   # Verificar conexión a DB
   node -e "require('./src/db/db')()"
   ```

6. **Iniciar en modo producción:**
   ```bash
   NODE_ENV=production npm start
   ```

### 🔍 7. POST-DESPLIEGUE

**Verificaciones:**
- [ ] SSL/HTTPS funcionando
- [ ] Base de datos conectando
- [ ] Logs sin información sensible
- [ ] CORS restringido a dominios correctos
- [ ] Rate limiting activo

**Monitoreo:**
```bash
# Verificar logs de aplicación
tail -f logs/produccion.log

# Verificar recursos del servidor
htop
df -h
```

### 🆘 8. SOLUCIÓN DE PROBLEMAS COMUNES

**Error de conexión a MongoDB:**
```bash
# Verificar conectividad
ping cluster0.vhx5w.mongodb.net
```

**Error de CORS:**
- Verificar que el dominio esté en CORS_ORIGIN
- Verificar protocolo (http vs https)

**Error de certificados SSL:**
```bash
# Verificar certificados
openssl x509 -in certificate.crt -text -noout
```

### 📞 CONTACTOS DE EMERGENCIA

- **Administrador DB:** [Tu contacto]
- **Hosting/Servidor:** [Tu contacto]
- **DNS/Dominio:** [Tu contacto]

---
**⚠️ IMPORTANTE:** Nunca deployar sin ejecutar `verify-security.js` y corregir todos los errores críticos.
