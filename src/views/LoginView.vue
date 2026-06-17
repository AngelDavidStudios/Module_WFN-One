<script setup lang="ts">
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '../stores/session'

const session = useSessionStore()

function login(): void {
  // BFF: navegación top-level al Managed Login de Cognito vía Sistema C.
  session.signIn('/post-login')
}

function onEnter(e: MouseEvent): void {
  const t = e.currentTarget as HTMLElement
  t.style.transform = 'translateY(-2px)'
  t.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)'
}
function onLeave(e: MouseEvent): void {
  const t = e.currentTarget as HTMLElement
  t.style.transform = 'translateY(0)'
  t.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)'
}
</script>

<template>
  <div
    style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      padding: 20px;
    "
  >
    <div
      style="
        background-color: #fff;
        border-radius: 24px;
        padding: 48px;
        max-width: 420px;
        width: 100%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        text-align: center;
      "
    >
      <div
        style="
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 10px 40px rgba(59, 130, 246, 0.3);
        "
      >
        <CalendarDaysIcon style="width: 48px; height: 48px; color: #fff" />
      </div>

      <h1
        style="
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        "
      >
        WFN One
      </h1>

      <p
        style="
          color: #6b7280;
          font-size: 1rem;
          margin-bottom: 32px;
          line-height: 1.6;
        "
      >
        Sistema de Gestión de Vacaciones
      </p>

      <button
        style="
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        "
        @click="login"
        @mouseenter="onEnter"
        @mouseleave="onLeave"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          :stroke-width="2"
          stroke="currentColor"
          style="width: 20px; height: 20px"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
          />
        </svg>
        Iniciar Sesión
      </button>

      <p style="margin-top: 32px; font-size: 0.8rem; color: #9ca3af">
        Acceso seguro con AWS Cognito
      </p>
    </div>
  </div>
</template>
