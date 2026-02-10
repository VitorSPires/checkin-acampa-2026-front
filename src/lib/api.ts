import type {
  CheckinResponse,
  CheckoutResponse,
  ListarPresentesResponse,
  Usuario,
  UsuarioCreate,
  UsuarioUpdate,
  Time,
  TimeCreate,
  TimeUpdate,
  Onibus,
  OnibusCreate,
  OnibusUpdate,
  Sistema,
  SistemaUpdate,
} from "@/types/api"

const BASE_URL =
  typeof import.meta.env.VITE_API_URL === "string" && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
    : "http://localhost:8000"

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
  if (!res.ok) {
    const detail =
      (await res.json().catch(() => ({})))?.detail ?? res.statusText
    throw createApiError(res.status, typeof detail === "string" ? detail : String(detail))
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface ApiErrorType extends Error {
  status: number
}

export function createApiError(status: number, message: string): ApiErrorType {
  const e = new Error(message) as ApiErrorType
  e.name = "ApiError"
  e.status = status
  return e
}

export function isApiError(err: unknown): err is ApiErrorType {
  return err instanceof Error && "status" in err && typeof (err as ApiErrorType).status === "number"
}

export const api = {
  checkin(cpf: string) {
    return request<CheckinResponse>("/checkin", {
      method: "POST",
      body: JSON.stringify({ cpf }),
    })
  },

  checkout(cpf: string) {
    return request<CheckoutResponse>("/checkout", {
      method: "POST",
      body: JSON.stringify({ cpf }),
    })
  },

  listarPresentes() {
    return request<ListarPresentesResponse>("/listar-presentes")
  },

  getSistema() {
    return request<Sistema>("/sistema")
  },

  updateSistema(body: SistemaUpdate) {
    return request<Sistema>("/sistema", {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  },

  getUsuarios(skip = 0, limit = 100) {
    return request<Usuario[]>(`/usuarios?skip=${skip}&limit=${limit}`)
  },

  getUsuario(id: number) {
    return request<Usuario>(`/usuarios/${id}`)
  },

  createUsuario(body: UsuarioCreate) {
    return request<Usuario>("/usuarios", {
      method: "POST",
      body: JSON.stringify(body),
    })
  },

  updateUsuario(id: number, body: UsuarioUpdate) {
    return request<Usuario>(`/usuarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  },

  deleteUsuario(id: number) {
    return request<void>(`/usuarios/${id}`, { method: "DELETE" })
  },

  getTimes(skip = 0, limit = 100) {
    return request<Time[]>(`/times?skip=${skip}&limit=${limit}`)
  },

  getTime(id: number) {
    return request<Time>(`/times/${id}`)
  },

  createTime(body: TimeCreate) {
    return request<Time>("/times", {
      method: "POST",
      body: JSON.stringify(body),
    })
  },

  updateTime(id: number, body: TimeUpdate) {
    return request<Time>(`/times/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  },

  deleteTime(id: number) {
    return request<void>(`/times/${id}`, { method: "DELETE" })
  },

  getOnibusList(skip = 0, limit = 100) {
    return request<Onibus[]>(`/onibus?skip=${skip}&limit=${limit}`)
  },

  getOnibus(id: number) {
    return request<Onibus>(`/onibus/${id}`)
  },

  createOnibus(body: OnibusCreate) {
    return request<Onibus>("/onibus", {
      method: "POST",
      body: JSON.stringify(body),
    })
  },

  updateOnibus(id: number, body: OnibusUpdate) {
    return request<Onibus>(`/onibus/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  },

  deleteOnibus(id: number) {
    return request<void>(`/onibus/${id}`, { method: "DELETE" })
  },
}
