<template>
  <q-page class="row items-center justify-center q-pa-md">
    <q-card style="min-width: 360px; max-width: 480px; width: 100%">
      <q-card-section>
        <div class="text-h6">Регистрация</div>
      </q-card-section>

      <RegisterForm />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import RegisterForm from 'widgets/auth/RegisterForm.vue';
</script>


