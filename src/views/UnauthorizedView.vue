<script setup lang="ts">
import { useAuth } from '../composables/useAuth'

const { roles, isAdmin, isSuperAdmin } = useAuth()
</script>

<template>
  <div
    style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 100px);
      padding: 32px;
      text-align: center;
    "
  >
    <div style="font-size: 6rem; margin-bottom: 24px">🚫</div>

    <h1 style="font-size: 2.5rem; color: #e74c3c; margin-bottom: 16px">
      Acceso No Autorizado
    </h1>

    <p
      style="
        font-size: 1.1rem;
        color: #666;
        max-width: 500px;
        margin-bottom: 24px;
      "
    >
      No tienes los permisos necesarios para acceder a esta sección.
      <br />
      Tu rol actual es:
      <strong>{{ roles.join(', ') || 'Sin rol asignado' }}</strong>
    </p>

    <div
      style="
        padding: 20px;
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 8px;
        margin-bottom: 32px;
        max-width: 500px;
      "
    >
      <p style="margin: 0; color: #856404">
        💡 <strong>Tip:</strong> Si crees que deberías tener acceso a esta
        página, contacta a un administrador para que te asigne los permisos
        correspondientes.
      </p>
    </div>

    <div
      style="
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        justify-content: center;
      "
    >
      <RouterLink
        to="/"
        style="
          padding: 12px 24px;
          background-color: #3498db;
          color: #fff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
        "
      >
        🏠 Ir al Inicio
      </RouterLink>

      <RouterLink
        to="/dashboard"
        style="
          padding: 12px 24px;
          background-color: #27ae60;
          color: #fff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
        "
      >
        📊 Mi Dashboard
      </RouterLink>
    </div>

    <div
      style="
        margin-top: 48px;
        padding: 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
        max-width: 400px;
      "
    >
      <h3 style="margin-bottom: 12px; color: #495057">
        Tus permisos actuales:
      </h3>
      <ul style="list-style: none; padding: 0; margin: 0; text-align: left">
        <li style="margin-bottom: 8px">
          {{ roles.length > 0 ? '✅' : '❌' }} Autenticado
        </li>
        <li style="margin-bottom: 8px">
          {{ isAdmin ? '✅' : '❌' }} Acceso de Administrador
        </li>
        <li style="margin-bottom: 8px">
          {{ isSuperAdmin ? '✅' : '❌' }} Acceso de Super Admin
        </li>
      </ul>
    </div>
  </div>
</template>
