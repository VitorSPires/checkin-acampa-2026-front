export interface CheckinResponse {
  nome: string
  sexo: string | null
  nome_onibus: string | null
  nome_time: string | null
  nome_responsavel_time: string | null
  nome_pequeno_grupo: string | null
  nome_responsavel_pequeno_grupo: string | null
}

export interface CheckoutResponse {
  nome: string
  sexo: string | null
  nome_onibus: string | null
}

export interface PresenteItem {
  nome: string
  data_checkin: string | null
}

export interface AusenteItem {
  nome: string
}

export interface ListarPresentesResponse {
  presentes: PresenteItem[]
  quantidade_presentes: number
  ausentes: AusenteItem[]
  quantidade_ausentes: number
}

export interface Usuario {
  id: number
  nome: string
  cpf: string
  sexo: string | null
  id_time: number | null
  id_onibus: number | null
  id_pequeno_grupo: number | null
  datahora_checkin: string | null
  datahora_checkout: string | null
}

export interface UsuarioCreate {
  nome: string
  cpf: string
  sexo?: string | null
  id_time?: number | null
  id_onibus?: number | null
  id_pequeno_grupo?: number | null
}

export interface UsuarioUpdate {
  nome?: string | null
  cpf?: string | null
  sexo?: string | null
  id_time?: number | null
  id_onibus?: number | null
  id_pequeno_grupo?: number | null
}

export interface Time {
  id: number
  nome: string
  cor_hex: string
  nome_responsavel: string | null
}

export interface TimeCreate {
  nome: string
  cor_hex: string
  nome_responsavel?: string | null
}

export interface TimeUpdate {
  nome?: string | null
  cor_hex?: string | null
  nome_responsavel?: string | null
}

export interface Onibus {
  id: number
  nome: string
}

export interface OnibusCreate {
  nome: string
}

export interface OnibusUpdate {
  nome?: string | null
}

export interface PequenoGrupo {
  id: number
  nome: string
  nome_responsavel: string | null
}

export interface PequenoGrupoCreate {
  nome: string
  nome_responsavel?: string | null
}

export interface PequenoGrupoUpdate {
  nome?: string | null
  nome_responsavel?: string | null
}

export interface Sistema {
  id: number
  mensagem_cpf_nao_encontrado: string
  senha_adm: string
}

export interface SistemaUpdate {
  mensagem_cpf_nao_encontrado?: string | null
  senha_adm?: string | null
}
