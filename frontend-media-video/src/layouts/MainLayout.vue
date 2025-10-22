<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>media-video-test</q-toolbar-title>

        <q-btn flat round dense icon="person" />
        <q-menu>
          <q-list style="min-width: 200px">
            <q-item clickable v-close-popup @click="onLogout">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>Выход</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header>Меню</q-item-label>

        <q-item
          clickable
          :to="'/'"
          exact
          active-class="bg-primary text-white"
        >
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Главная</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          :to="'/upload-video'"
          active-class="bg-primary text-white"
        >
          <q-item-section avatar>
            <q-icon name="upload" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Загрузка видео</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          :to="'/videos'"
          active-class="bg-primary text-white"
        >
          <q-item-section avatar>
            <q-icon name="video_library" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Просмотр видео</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-md" />

        <q-item
          clickable
          :to="'/settings'"
          active-class="bg-primary text-white"
        >
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Настройки</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth-store';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

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
