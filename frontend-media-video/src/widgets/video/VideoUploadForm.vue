<template>
  <q-card>
    <q-card-section>
      <div class="text-h5 q-mb-md">Загрузка видео</div>
      <div class="text-body2 text-grey-7 q-mb-md">
        Поддерживаемые форматы: MP4, WebM, OGG, MOV, AVI, MKV. Максимальный размер: 10 ГБ
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-input
          v-model="videoName"
          label="Название видео (опционально)"
          outlined
          clearable
          hint="Если не указано, будет использовано имя файла"
        />

        <q-file
          v-model="videoFile"
          label="Выберите видеофайл"
          outlined
          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.ogg,.mov,.avi,.mkv"
          max-file-size="10737418240"
          @rejected="onRejected"
          :disable="videoStore.uploading"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
          <template v-slot:hint>
            Выберите файл размером до 10 ГБ
          </template>
        </q-file>

        <div v-if="videoStore.uploading" class="q-mt-md">
          <div class="text-body2 text-grey-7 q-mb-sm">
            Загрузка: {{ videoStore.uploadProgress }}%
          </div>
          <q-linear-progress
            :value="videoStore.uploadProgress / 100"
            color="primary"
            size="20px"
            class="q-mt-sm"
          />
        </div>

        <div class="q-mt-md">
          <q-btn
            type="submit"
            label="Загрузить видео"
            color="primary"
            icon="upload"
            :loading="videoStore.uploading"
            :disable="!videoFile || videoStore.uploading"
            class="full-width"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';
import { useVideoStore } from 'src/stores/video-store';

const $q = useQuasar();
const auth = useAuthStore();
const videoStore = useVideoStore();

const videoName = ref('');
const videoFile = ref<File | null>(null);

const emit = defineEmits<{
  'upload-success': [];
}>();

function onRejected(rejectedEntries: { failedPropValidation: string }[]) {
  const reason = rejectedEntries[0]?.failedPropValidation;
  let message = 'Файл не может быть загружен';

  if (reason === 'max-file-size') {
    message = 'Размер файла превышает 10 ГБ';
  } else if (reason === 'accept') {
    message = 'Неподдерживаемый формат файла. Поддерживаются: MP4, WebM, OGG, MOV, AVI, MKV';
  }

  $q.notify({
    type: 'negative',
    message,
    position: 'top',
  });
}

async function onSubmit() {
  if (!videoFile.value || !auth.user) {
    return;
  }

  try {
    await videoStore.uploadVideo({
      file: videoFile.value,
      userId: auth.user._id,
      name: videoName.value,
    });

    $q.notify({
      type: 'positive',
      message: 'Видео успешно загружено!',
      position: 'top',
    });

    // Сбрасываем форму
    videoName.value = '';
    videoFile.value = null;

    emit('upload-success');
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Ошибка при загрузке видео',
      position: 'top',
    });
  }
}
</script>

