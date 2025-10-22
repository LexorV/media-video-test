<template>
  <q-card v-if="video">
    <q-card-section>
      <div class="text-h5 q-mb-md">{{ video.name }}</div>

      <div v-if="video.conversionStatus === 'processing'">
        <q-banner class="bg-warning text-white q-mb-md">
          <template v-slot:avatar>
            <q-icon name="hourglass_empty" />
          </template>
          Видео обрабатывается. Пожалуйста, подождите...
        </q-banner>
        <q-linear-progress indeterminate color="warning" />
      </div>

      <div v-else-if="video.conversionStatus === 'failed'">
        <q-banner class="bg-negative text-white">
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          Ошибка при обработке видео
        </q-banner>
      </div>

      <div v-else>
        <video
          ref="videoPlayerRef"
          controls
          class="full-width"
          style="max-height: 60vh; background: #000;"
          :key="video.id"
        >
          <source :src="videoUrl" :type="video.mimeType">
          Ваш браузер не поддерживает воспроизведение видео.
        </video>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="text-h6 q-mb-md">Информация о видео</div>
      <q-list dense>
        <q-item>
          <q-item-section>
            <q-item-label caption>Оригинальное имя</q-item-label>
            <q-item-label>{{ video.originalName }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Размер</q-item-label>
            <q-item-label>{{ formatFileSize(video.size) }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Тип</q-item-label>
            <q-item-label>{{ video.mimeType }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="video.duration">
          <q-item-section>
            <q-item-label caption>Длительность</q-item-label>
            <q-item-label>{{ formatDuration(video.duration) }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Дата загрузки</q-item-label>
            <q-item-label>{{ formatDate(video.createdAt) }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="video.isConverted">
          <q-item-section>
            <q-item-label caption>Конвертировано</q-item-label>
            <q-item-label>
              <q-chip color="info" text-color="white" size="sm">
                Да ({{ video.originalFormat }} → MP4)
              </q-chip>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn
        flat
        label="Удалить"
        color="negative"
        icon="delete"
        @click="emit('delete')"
      />
    </q-card-actions>
  </q-card>

  <q-card v-else class="text-center q-pa-xl">
    <q-icon name="play_circle_outline" size="128px" color="grey-5" />
    <div class="text-h6 text-grey-7 q-mt-md">
      Выберите видео для просмотра
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Video } from 'src/shared/types';
import { formatFileSize, formatDate, formatDuration } from 'src/shared/utils/formatters';

interface Props {
  video: Video | null;
  videoUrl: string;
}

defineProps<Props>();

const emit = defineEmits<{
  'delete': [];
}>();

const videoPlayerRef = ref<HTMLVideoElement | null>(null);
</script>

