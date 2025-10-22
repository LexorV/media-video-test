<template>
  <q-card>
    <q-card-section>
      <div class="text-h6 q-mb-md">Изменить пароль</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-input
          v-model="form.newPassword"
          label="Новый пароль"
          :type="isPwd ? 'password' : 'text'"
          outlined
          clearable
          :rules="[required, minLength(6)]"
        >
          <template #append>
            <q-icon
              :name="isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="isPwd = !isPwd"
            />
          </template>
        </q-input>

        <q-input
          v-model="form.confirmPassword"
          label="Подтвердите пароль"
          :type="isPwd ? 'password' : 'text'"
          outlined
          clearable
          :rules="[required, minLength(6), matchPassword]"
        >
          <template #append>
            <q-icon
              :name="isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="isPwd = !isPwd"
            />
          </template>
        </q-input>

        <div class="q-mt-md">
          <q-btn
            type="submit"
            label="Изменить пароль"
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
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore, useSettingsStore } from 'src/stores';
import { required, minLength } from 'shared/validation/rules';

const $q = useQuasar();
const auth = useAuthStore();
const settings = useSettingsStore();

const form = ref({
  newPassword: '',
  confirmPassword: '',
});

const submitting = ref(false);
const isPwd = ref(true);

const matchPassword = (val: string) => {
  return val === form.value.newPassword || 'Пароли не совпадают';
};

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
    const result = await settings.changePassword(auth.user._id, form.value.newPassword);

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Пароль успешно изменен!',
        position: 'top',
      });
      form.value.newPassword = '';
      form.value.confirmPassword = '';
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Ошибка при изменении пароля',
        position: 'top',
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при изменении пароля',
      position: 'top',
    });
  } finally {
    submitting.value = false;
  }
}
</script>

