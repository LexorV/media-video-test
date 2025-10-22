<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6 q-gutter-md">
        <UserProfileForm />
        <ChangePasswordForm />

        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Выход из системы</div>
            <div class="text-body2 text-grey-7 q-mb-md">
              Завершить текущий сеанс работы
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn
              flat
              label="Выйти"
              color="negative"
              icon="logout"
              @click="onLogout"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';
import UserProfileForm from 'widgets/settings/UserProfileForm.vue';
import ChangePasswordForm from 'widgets/settings/ChangePasswordForm.vue';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();

function onLogout() {
  auth.logout();
  $q.notify({
    type: 'info',
    message: 'Вы вышли из системы',
    position: 'top',
  });
  void router.push('/login');
}
</script>

