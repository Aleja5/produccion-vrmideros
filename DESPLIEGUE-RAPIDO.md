# 🚀 INSTRUCCIONES RÁPIDAS PARA DESPLIEGUE

## ⚡ PASOS RÁPIDOS (Primera vez)

### 1. Preparar base de datos (5 minutos)
1. Ve a [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Crea cuenta → Create cluster (M0 FREE)
3. Database Access → Add user
4. Network Access → Add `0.0.0.0/0`
5. Connect → Get connection string

### 2. Subir a GitHub (2 minutos)
```bash
git add .
git commit -m "Preparando despliegue"
git push origin main
```

### 3. Backend en Render (3 minutos)
1. [render.com](https://render.com) → New Web Service
2. Conectar GitHub repo
3. **Build Command**: `cd backend && npm install`
4. **Start Command**: `cd backend && npm start`
5. Variables de entorno:
   ```
   PORT=10000
   MONGODB_URI=tu_mongodb_uri
   JWT_SECRET=tu_jwt_secret
   NODE_ENV=production
   ```

### 4. Frontend en Vercel (2 minutos)
1. [vercel.com](https://vercel.com) → New Project
2. Import GitHub repo
3. **Root Directory**: `frontend`
4. Variable de entorno:
   ```
   VITE_API_URL=https://tu-app-backend.onrender.com
   ```

### 5. Actualizar CORS en backend
```javascript
// En server.js
const corsOptions = {
  origin: ['https://tu-app.vercel.app'],
  credentials: true
};
```

## 🔥 ¡LISTO! Tu app estará en línea en ~15 minutos

---

## 📞 ¿Problemas?

- **Backend no arranca**: Revisar logs en Render
- **Frontend no conecta**: Verificar URL del API
- **Base de datos falla**: Verificar connection string
- **CORS error**: Verificar origins en backend

## 💡 Recuerda
- Primera visita puede tardar 30-60 segundos (Render se despierta)
- Cambios se auto-despliegan cuando haces push a GitHub
- Planes gratuitos tienen límites pero son suficientes para empezar
