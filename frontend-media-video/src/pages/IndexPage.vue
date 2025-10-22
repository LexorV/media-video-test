<template>
  <q-page class="column items-center justify-center q-pa-md">
    <q-card class="col-12 col-md-6">
      <q-card-section>
        <div class="text-h4 q-mb-md">Добро пожаловать!</div>
        <div class="text-subtitle1" v-if="auth.user">
          Привет, {{ auth.user.login }}! 👋
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-body1 q-mb-md">
          Это главная страница вашего приложения.
        </div>
        <div class="text-body2 text-grey-7">
          Используйте меню слева для навигации по приложению.
        </div>
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          flat
          color="primary"
          label="Перейти в настройки"
          icon-right="arrow_forward"
          :to="'/settings'"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useAuthStore } from 'stores/auth-store';

const auth = useAuthStore();
</script>
