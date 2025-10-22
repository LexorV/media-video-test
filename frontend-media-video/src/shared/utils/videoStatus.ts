/**
 * Возвращает цвет для статуса конвертации видео
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'orange';
    case 'processing':
      return 'warning';
    case 'completed':
      return 'positive';
    case 'failed':
      return 'negative';
    default:
      return 'grey';
  }
}

/**
 * Возвращает метку для статуса конвертации видео
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'В очереди';
    case 'processing':
      return 'Обработка';
    case 'completed':
      return 'Готово';
    case 'failed':
      return 'Ошибка';
    default:
      return status;
  }
}

