<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Боковая панель со списком видео -->
      <div class="col-12 col-md-4">
        <VideoList
          :videos="videoStore.videos"
          :total-videos="videoStore.totalVideos"
          :selected-video-id="selectedVideoId"
          :loading="videoStore.loading"
          @select-video="handleSelectVideo"
          @delete-video="handleDeleteVideo"
          @upload-video="goToUpload"
          @refresh="handleRefresh"
        />
      </div>

      <!-- Основная область просмотра -->
      <div class="col-12 col-md-8">
        <VideoPlayer
          :video="selectedVideo"
          :video-url="videoUrl"
          @delete="handleDeleteSelectedVideo"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';
import { useVideoStore } from 'src/stores/video-store';
import type { Video } from 'src/shared/types';
import VideoList from 'src/widgets/video/VideoList.vue';
import VideoPlayer from 'src/widgets/video/VideoPlayer.vue';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();
const videoStore = useVideoStore();

const selectedVideoId = ref<string | null>(null);

const selectedVideo = computed<Video | null>(() => {
  if (!selectedVideoId.value) return null;
  return videoStore.videos.find((v) => v.id === selectedVideoId.value) || null;
});

const videoUrl = computed(() => {
  if (!selectedVideo.value || !auth.user) return '';
  return videoStore.getVideoUrl(selectedVideo.value.id, auth.user._id);
});

onMounted(() => {
  void loadVideos();
});

async function loadVideos() {
  if (!auth.user) return;

  try {
    await videoStore.loadVideos({
      userId: auth.user._id,
      limit: 100,
      offset: 0,
    });

    // Если есть видео, но ни одно не выбрано, выбираем первое
    if (videoStore.videos.length > 0 && !selectedVideoId.value) {
      selectedVideoId.value = videoStore.videos[0]?.id || null;
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Ошибка при загрузке списка видео',
      position: 'top',
    });
  }
}

function handleSelectVideo(videoId: string) {
  selectedVideoId.value = videoId;
}

function handleDeleteVideo(videoId: string) {
  const video = videoStore.videos.find((v) => v.id === videoId);
  if (!video) return;

  $q.dialog({
    title: 'Удаление видео',
    message: `Вы уверены, что хотите удалить видео "${video.name}"?`,
    cancel: {
      label: 'Отмена',
      flat: true,
    },
    ok: {
      label: 'Удалить',
      color: 'negative',
    },
  }).onOk(() => {
    void deleteVideo(videoId);
  });
}

function handleDeleteSelectedVideo() {
  if (selectedVideo.value) {
    handleDeleteVideo(selectedVideo.value.id);
  }
}

async function deleteVideo(videoId: string) {
  if (!auth.user) return;

  try {
    await videoStore.deleteVideo({
      videoId,
      userId: auth.user._id,
    });

    $q.notify({
      type: 'positive',
      message: 'Видео успешно удалено',
      position: 'top',
    });

    // Если удалили выбранное видео, сбрасываем выбор
    if (selectedVideoId.value === videoId) {
      selectedVideoId.value = videoStore.videos.length > 0 ? (videoStore.videos[0]?.id || null) : null;
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Ошибка при удалении видео',
      position: 'top',
    });
  }
}

function handleRefresh() {
  void loadVideos();
}

function goToUpload() {
  void router.push('/upload-video');
}
</script>

