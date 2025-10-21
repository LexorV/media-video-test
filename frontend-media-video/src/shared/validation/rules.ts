export function required(val: string) {
  return (val && val.length > 0) || 'Обязательное поле';
}

export function minLength(min: number) {
  return (val: string) => (val && val.length >= min) || `Минимум ${min} символов`;
}

export function email(val: string) {
  const re = /\S+@\S+\.\S+/;
  return re.test(val) || 'Некорректный email';
}


