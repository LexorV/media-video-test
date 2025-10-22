export interface User {
  _id: string;
  login: string;
  email?: string;
  name?: string;
  age?: number;
}

export interface RegisterData {
  login: string;
  password: string;
  name?: string;
  age?: number;
}

export interface LoginData {
  login: string;
  password: string;
}

