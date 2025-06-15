# 🤖 TinyTasks MCP Server

Servidor MCP híbrido que funciona tanto con **Claude Desktop** como con **Claude Web**.

## ✅ Estado del Proyecto

- **API NestJS**: ✅ Funcionando en `https://forgetful-production-a037.up.railway.app`
- **MCP Server Local**: ✅ Listo para Claude Desktop
- **MCP Server Web**: ✅ Listo para despliegue y Claude Web
- **8 Herramientas**: ✅ Todas implementadas y probadas

## 🛠️ Herramientas Disponibles

1. **get_api_status** - Estado de la API
2. **get_tasks_stats** - Estadísticas de tareas
3. **list_tasks** - Listar tareas (con filtros)
4. **get_task** - Obtener tarea específica
5. **create_task** - Crear nueva tarea
6. **update_task** - Actualizar tarea
7. **toggle_task** - Alternar estado
8. **delete_task** - Eliminar tarea

## 🌐 Para Claude Web (Servidor Público)

### Opción 1: Desplegar en Railway

1. **Instalar Railway CLI:**
```bash
npm i -g @railway/cli
```

2. **Crear nuevo proyecto:**
```bash
railway login
railway init
railway up
```

3. **Configurar variables:**
```bash
railway variables set WEB_MODE=true
```

4. **Obtener URL:**
```bash
railway status
```

### Opción 2: Desplegar en Vercel

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Desplegar:**
```bash
vercel --prod
```

### Usar en Claude Web

Una vez desplegado, tendrás una URL como:
- Railway: `https://tu-proyecto.railway.app`
- Vercel: `https://tu-proyecto.vercel.app`

**Endpoints disponibles:**
- `GET /` - Información del servidor
- `GET /mcp/tools` - Lista de herramientas
- `POST /mcp/execute` - Ejecutar herramienta

**Ejemplo de uso en Claude Web:**
```
Puedes usar mi MCP server en: https://tu-proyecto.railway.app

Herramientas disponibles en: https://tu-proyecto.railway.app/mcp/tools

Para ejecutar una herramienta, haz POST a: https://tu-proyecto.railway.app/mcp/execute
con el body: {"tool": "get_tasks_stats"}
```

## 🖥️ Para Claude Desktop (Servidor Local)

### 1. Configurar Claude Desktop

Edita: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tinytasks": {
      "command": "node",
      "args": ["/Users/franciscogoulu/Desktop/Fran Dev/Forgetful3/mcp-tinytasks-server/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 2. Reiniciar Claude Desktop

## 🧪 Probar Localmente

### Modo Claude Desktop:
```bash
node index.js
```

### Modo Claude Web:
```bash
WEB_MODE=true node index.js
```

Luego visita: `http://localhost:3001`

## 📋 Endpoints de la API Web

### GET /
Información del servidor

### GET /mcp/tools
Lista todas las herramientas disponibles

### POST /mcp/execute
Ejecuta una herramienta específica

**Body:**
```json
{
  "tool": "get_tasks_stats",
  "arguments": {}
}
```

**Ejemplo con argumentos:**
```json
{
  "tool": "create_task",
  "arguments": {
    "title": "Nueva tarea desde Claude Web",
    "priority": "high"
  }
}
```

## 🔍 Verificar Funcionamiento

### Probar API directamente:
```bash
curl https://tu-mcp-server.railway.app/mcp/tools
```

### Ejecutar herramienta:
```bash
curl -X POST https://tu-mcp-server.railway.app/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_api_status"}'
```

## 🎯 Resumen de Opciones

### Para Claude Desktop:
- Usa el servidor local con protocolo MCP nativo
- Configuración en `claude_desktop_config.json`

### Para Claude Web:
- Despliega el servidor como API REST
- Usa endpoints HTTP para comunicación
- Accesible desde cualquier lugar

¡Ambos modos consumen la misma API de TinyTasks! # Updated Sun Jun 15 20:54:37 -03 2025
