<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <q-card-section>
      <q-input
        v-model="email"
        label="Email"
        type="email"
        :rules="[required, emailRule]"
        dense
        outlined
        clearable
        autocomplete="email"
      />
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
        autocomplete="new-password"
      >
        <template #append>
          <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
        </template>
      </q-input>
    </q-card-section>

    <q-card-actions align="between">
      <q-btn type="submit" label="Зарегистрироваться" color="primary" :disable="submitting" />
      <q-btn flat label="Войти" color="primary" :to="{ path: '/login' }" />
    </q-card-actions>
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { required, minLength, email as emailRule } from 'shared/validation/rules';

const router = useRouter();

const email = ref('');
const login = ref('');
const password = ref('');
const isPwd = ref(true);
const submitting = ref(false);

async function onSubmit() {
  submitting.value = true;
  try {
    await router.push('/login');
  } finally {
    submitting.value = false;
  }
}
</script>


