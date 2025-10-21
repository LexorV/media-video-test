<template>
  <q-page class="row items-center justify-center q-pa-md">
    <q-card style="min-width: 360px; max-width: 420px; width: 100%">
      <q-card-section>
        <div class="text-h6">Вход</div>
      </q-card-section>

      <LoginForm />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import LoginForm from 'widgets/auth/LoginForm.vue';
</script>


