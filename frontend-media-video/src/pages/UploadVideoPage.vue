<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <VideoUploadForm @upload-success="handleUploadSuccess" />

        <div class="q-mt-md">
          <RecentVideos @view-video="goToVideos" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import VideoUploadForm from 'src/widgets/video/VideoUploadForm.vue';
import RecentVideos from 'src/widgets/video/RecentVideos.vue';

const router = useRouter();

function handleUploadSuccess() {
  // Можно добавить дополнительную логику после успешной загрузки
}

function goToVideos() {
  void router.push('/videos');
}
</script>

