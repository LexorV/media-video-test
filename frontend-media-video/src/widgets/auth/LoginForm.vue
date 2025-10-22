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
      <q-btn type="submit" label="Войти" color="primary" :disable="submitting" :loading="submitting" />
      <q-btn flat label="Регистрация" color="primary" :to="{ path: '/register' }" />
    </q-card-actions>
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth-store';
import { required, minLength } from 'shared/validation/rules';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();

const login = ref('');
const password = ref('');
const isPwd = ref(true);
const submitting = ref(false);

async function onSubmit() {
  submitting.value = true;
  try {
    const result = await auth.login({
      login: login.value,
      password: password.value,
    });

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Вход выполнен успешно!',
        position: 'top',
      });
      await router.push('/');
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Неверный логин или пароль',
        position: 'top',
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Произошла ошибка при входе',
      position: 'top',
    });
  } finally {
    submitting.value = false;
  }
}
</script>


