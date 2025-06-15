#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';

const API_BASE_URL = 'https://forgetful-production-a037.up.railway.app';
const PORT = process.env.PORT || 3001;

// Función para hacer peticiones HTTP
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Error en ${endpoint}: ${error.message}`);
  }
}

// Definir las herramientas MCP
const tools = [
  {
    name: 'get_api_status',
    description: 'Obtiene el estado actual de la API de TinyTasks',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_tasks_stats',
    description: 'Obtiene estadísticas de las tareas: total, completadas, pendientes',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_tasks',
    description: 'Lista todas las tareas con filtro opcional por estado',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['completed', 'pending'],
          description: 'Filtrar por estado: completed o pending',
        },
      },
    },
  },
  {
    name: 'get_task',
    description: 'Obtiene los detalles de una tarea específica',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID único de la tarea (UUID)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_task',
    description: 'Crea una nueva tarea',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título de la tarea (requerido)',
        },
        detail: {
          type: 'string',
          description: 'Descripción detallada de la tarea',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Prioridad de la tarea',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Actualiza una tarea existente',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID único de la tarea a actualizar',
        },
        title: {
          type: 'string',
          description: 'Nuevo título de la tarea',
        },
        detail: {
          type: 'string',
          description: 'Nueva descripción de la tarea',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Nueva prioridad de la tarea',
        },
        isDone: {
          type: 'boolean',
          description: 'Estado de completación de la tarea',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'toggle_task',
    description: 'Alterna el estado de completación de una tarea',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID único de la tarea a alternar',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Elimina permanentemente una tarea',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID único de la tarea a eliminar',
        },
      },
      required: ['id'],
    },
  },
];

// Handlers para cada herramienta
async function handleTool(name, args) {
  switch (name) {
    case 'get_api_status':
      const status = await makeRequest('/tasks/status');
      return {
        content: [
          {
            type: 'text',
            text: `Estado de la API: ${status.status}\nModo: ${status.mode}\nBase de datos: ${status.dbStatus}\nTimestamp: ${status.timestamp}`,
          },
        ],
      };

    case 'get_tasks_stats':
      const stats = await makeRequest('/tasks/stats');
      return {
        content: [
          {
            type: 'text',
            text: `Estadísticas de Tareas:
- Total: ${stats.stats.total}
- Completadas: ${stats.stats.completed}
- Pendientes: ${stats.stats.pending}
- Tasa de completación: ${stats.stats.completionRate}%`,
          },
        ],
      };

    case 'list_tasks':
      const params = args.status ? `?status=${args.status}` : '';
      const tasks = await makeRequest(`/tasks${params}`);
      const tasksText = tasks.tasks.map(task => 
        `• ${task.title} (${task.priority}) - ${task.isDone ? 'Completada' : 'Pendiente'}
  ID: ${task.id}
  Detalle: ${task.detail || 'Sin detalle'}
  Creada: ${new Date(task.createdAt).toLocaleString()}`
      ).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Tareas encontradas: ${tasks.total}\n\n${tasksText}`,
          },
        ],
      };

    case 'get_task':
      const task = await makeRequest(`/tasks/${args.id}`);
      return {
        content: [
          {
            type: 'text',
            text: `Tarea: ${task.task.title}
ID: ${task.task.id}
Estado: ${task.task.isDone ? 'Completada' : 'Pendiente'}
Prioridad: ${task.task.priority}
Detalle: ${task.task.detail || 'Sin detalle'}
Usuario: ${task.task.userId}
Creada: ${new Date(task.task.createdAt).toLocaleString()}
Actualizada: ${new Date(task.task.updatedAt).toLocaleString()}`,
          },
        ],
      };

    case 'create_task':
      const newTask = await makeRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: args.title,
          detail: args.detail || '',
          priority: args.priority || 'medium',
          userId: '123'
        })
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Tarea creada exitosamente:
Título: ${newTask.task.title}
ID: ${newTask.task.id}
Prioridad: ${newTask.task.priority}
Detalle: ${newTask.task.detail || 'Sin detalle'}`,
          },
        ],
      };

    case 'update_task':
      const { id, ...updateData } = args;
      const updatedTask = await makeRequest(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Tarea actualizada exitosamente:
Título: ${updatedTask.task.title}
ID: ${updatedTask.task.id}
Estado: ${updatedTask.task.isDone ? 'Completada' : 'Pendiente'}
Prioridad: ${updatedTask.task.priority}
Detalle: ${updatedTask.task.detail || 'Sin detalle'}`,
          },
        ],
      };

    case 'toggle_task':
      const toggledTask = await makeRequest(`/tasks/${args.id}/toggle`, {
        method: 'PATCH'
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Estado de tarea alternado:
Título: ${toggledTask.task.title}
Nuevo estado: ${toggledTask.task.isDone ? 'Completada' : 'Pendiente'}
ID: ${toggledTask.task.id}`,
          },
        ],
      };

    case 'delete_task':
      await makeRequest(`/tasks/${args.id}`, {
        method: 'DELETE'
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Tarea eliminada exitosamente (ID: ${args.id})`,
          },
        ],
      };

    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }
}

// Crear servidor Express para Claude Web
function createWebServer() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // Endpoint de información
  app.get('/', (req, res) => {
    res.json({
      name: 'TinyTasks MCP Server',
      version: '1.0.0',
      description: 'MCP Server para TinyTasks API',
      endpoints: {
        tools: '/mcp/tools',
        execute: '/mcp/execute'
      },
      api_base: API_BASE_URL
    });
  });
  
  // Endpoint para listar herramientas
  app.get('/mcp/tools', (req, res) => {
    res.json({
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    });
  });
  
  // Endpoint para ejecutar herramientas
  app.post('/mcp/execute', async (req, res) => {
    try {
      const { tool, arguments: args } = req.body;
      
      if (!tool) {
        return res.status(400).json({ error: 'Tool name is required' });
      }
      
      const result = await handleTool(tool, args || {});
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: error.message,
        content: [
          {
            type: 'text',
            text: `Error ejecutando ${req.body.tool}: ${error.message}`,
          },
        ],
        isError: true,
      });
    }
  });
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  return app;
}

// Crear servidor MCP para Claude Desktop
function createMCPServer() {
  const server = new Server(
    {
      name: 'tinytasks-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Registrar handler para listar herramientas
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Registrar handler para ejecutar herramientas
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      const result = await handleTool(name, args || {});
      return result;
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error ejecutando ${name}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });
  
  return server;
}

// Función principal
async function main() {
  const isWebMode = process.env.WEB_MODE === 'true' || process.argv.includes('--web');
  
  if (isWebMode) {
    // Modo Web Server para Claude Web
    const app = createWebServer();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌐 TinyTasks MCP Web Server iniciado en puerto ${PORT}`);
      console.log(`📡 Conectado a: ${API_BASE_URL}`);
      console.log(`🛠️  Herramientas disponibles: ${tools.length}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📋 Herramientas: http://localhost:${PORT}/mcp/tools`);
    });
  } else {
    // Modo MCP Server para Claude Desktop
    const server = createMCPServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    if (process.env.NODE_ENV !== 'production') {
      console.error('🚀 TinyTasks MCP Server iniciado (Claude Desktop)');
      console.error(`📡 Conectado a: ${API_BASE_URL}`);
      console.error(`🛠️  Herramientas disponibles: ${tools.length}`);
    }
  }
}

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Promesa rechazada:', reason);
  process.exit(1);
});

// Iniciar servidor
main().catch((error) => {
  console.error('Error iniciando el servidor:', error);
  process.exit(1);
}); 