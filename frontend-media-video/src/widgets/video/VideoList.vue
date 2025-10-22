<template>
  <q-card>
    <q-card-section class="bg-primary text-white">
      <div class="text-h6">Мои видео</div>
      <div class="text-caption">Всего: {{ totalVideos }}</div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-none" style="max-height: 70vh; overflow-y: auto;">
      <q-list v-if="videos.length > 0" separator>
        <q-item
          v-for="video in videos"
          :key="video.id"
          clickable
          :active="selectedVideoId === video.id"
          @click="emit('select-video', video.id)"
        >
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" icon="video_library" />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ video.name }}</q-item-label>
            <q-item-label caption>
              {{ formatFileSize(video.size) }}
            </q-item-label>
            <q-item-label caption v-if="video.conversionStatus !== 'none'">
              <q-chip
                :color="getStatusColor(video.conversionStatus)"
                text-color="white"
                size="sm"
                dense
              >
                {{ getStatusLabel(video.conversionStatus) }}
              </q-chip>
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              @click.stop="emit('delete-video', video.id)"
            >
              <q-tooltip>Удалить видео</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-section v-else class="text-center text-grey-7">
        <q-icon name="video_library" size="64px" color="grey-5" />
        <div class="text-h6 q-mt-md">Нет видео</div>
        <div class="text-body2 q-mb-md">
          Загрузите свое первое видео
        </div>
        <q-btn
          color="primary"
          label="Загрузить видео"
          icon="upload"
          @click="emit('upload-video')"
        />
      </q-card-section>
    </q-card-section>

    <q-separator v-if="videos.length > 0" />

    <q-card-actions v-if="videos.length > 0" align="center">
      <q-btn
        flat
        color="primary"
        label="Загрузить ещё"
        icon="upload"
        @click="emit('upload-video')"
      />
      <q-btn
        flat
        color="primary"
        label="Обновить"
        icon="refresh"
        @click="emit('refresh')"
        :loading="loading"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import type { Video } from 'src/shared/types';
import { formatFileSize } from 'src/shared/utils/formatters';
import { getStatusColor, getStatusLabel } from 'src/shared/utils/videoStatus';

interface Props {
  videos: Video[];
  totalVideos: number;
  selectedVideoId: string | null;
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'select-video': [videoId: string];
  'delete-video': [videoId: string];
  'upload-video': [];
  'refresh': [];
}>();
</script>

