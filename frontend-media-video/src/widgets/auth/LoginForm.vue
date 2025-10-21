<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <q-card-section>
      <q-input
        v-model="login"
        label="Логин"
        :rules="[required]"
        dense
        outlined
        clearable
        autocomplete="username"
      />
      <q-input
        v-model="password"
        label="Пароль"
        :type="isPwd ? 'password' : 'text'"
        :rules="[required, minLength(6)]"
        dense
        outlined
        clearable
        autocomplete="current-password"
      >
        <template #append>
          <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
        </template>
      </q-input>
    </q-card-section>

    <q-card-actions align="between">
      <q-btn type="submit" label="Войти" color="primary" :disable="submitting" />
      <q-btn flat label="Регистрация" color="primary" :to="{ path: '/register' }" />
    </q-card-actions>
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import { required, minLength } from 'shared/validation/rules';

const router = useRouter();
const auth = useAuthStore();

const login = ref('');
const password = ref('');
const isPwd = ref(true);
const submitting = ref(false);

async function onSubmit() {
  submitting.value = true;
  try {
    auth.login();
    await router.push('/');
  } finally {
    submitting.value = false;
  }
}
</script>


