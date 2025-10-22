<template>
  <q-card>
    <q-card-section>
      <div class="text-h5 q-mb-md">Настройки пользователя</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-input
          v-model="form.login"
          label="Логин"
          readonly
          filled
          disable
        />

        <q-input
          v-model="form.name"
          label="Имя"
          outlined
          clearable
        />

        <q-input
          v-model="form.email"
          label="Email"
          type="email"
          outlined
          clearable
        />

        <q-input
          v-model.number="form.age"
          label="Возраст"
          type="number"
          outlined
          clearable
        />

        <div class="q-mt-md">
          <q-btn
            type="submit"
            label="Сохранить"
            color="primary"
            :loading="submitting"
            :disable="submitting"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore, useSettingsStore } from 'src/stores';

const $q = useQuasar();
const auth = useAuthStore();
const settings = useSettingsStore();

const form = ref({
  login: '',
  name: '',
  email: '',
  age: undefined as number | undefined,
});

const submitting = ref(false);

onMounted(() => {
  if (auth.user) {
    form.value.login = auth.user.login;
    form.value.name = auth.user.name || '';
    form.value.email = auth.user.email || '';
    form.value.age = auth.user.age;
  }
});

async function onSubmit() {
  if (!auth.user?._id) {
    $q.notify({
      type: 'negative',
      message: 'Пользователь не авторизован',
      position: 'top',
    });
    return;
  }

  submitting.value = true;
  try {
    const updateData: { name?: string; email?: string; age?: number } = {};

    if (form.value.name) {
      updateData.name = form.value.name;
    }
    if (form.value.email) {
      updateData.email = form.value.email;
    }
    if (form.value.age !== undefined) {
      updateData.age = form.value.age;
    }

    const result = await settings.updateProfile(auth.user._id, updateData);

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Настройки успешно сохранены!',
        position: 'top',
      });
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Ошибка при сохранении настроек',
        position: 'top',
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при сохранении настроек',
      position: 'top',
    });
  } finally {
    submitting.value = false;
  }
}
</script>

