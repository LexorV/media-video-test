<template>
  <q-card v-if="videoStore.recentVideos.length > 0">
    <q-card-section>
      <div class="text-h6 q-mb-md">Недавно загруженные</div>
      <q-list separator>
        <q-item v-for="video in videoStore.recentVideos" :key="video.id">
          <q-item-section avatar>
            <q-icon name="video_library" color="primary" size="md" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ video.name }}</q-item-label>
            <q-item-label caption>
              {{ formatFileSize(video.size) }} • {{ formatDate(video.createdAt) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              dense
              round
              icon="play_arrow"
              color="primary"
              @click="emit('view-video')"
            >
              <q-tooltip>Перейти к просмотру</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { useVideoStore } from 'src/stores/video-store';
import { formatFileSize, formatDate } from 'src/shared/utils/formatters';

const videoStore = useVideoStore();

const emit = defineEmits<{
  'view-video': [];
}>();
</script>

