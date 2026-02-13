/** Item dentro de data.ary quando acn === "fv". cs = slide atual, ns = próximo slide. */
export interface ProPresenterAryItem {
  acn: string
  uid?: string
  txt?: string
}

/** Estado do stage: slide atual (cs/csn) e próximo (ns/nsn). stageUpdateKey muda a cada mensagem fv para invalidar cache das imagens. */
export interface ProPresenterStageState {
  currentSlideUid: string | null
  currentSlideText: string
  currentSlideNotes: string
  nextSlideUid: string | null
  nextSlideText: string
  nextSlideNotes: string
  stageUpdateKey: number
}

export const INITIAL_STAGE_STATE: ProPresenterStageState = {
  currentSlideUid: null,
  currentSlideText: "",
  currentSlideNotes: "",
  nextSlideUid: null,
  nextSlideText: "",
  nextSlideNotes: "",
  stageUpdateKey: 0,
}
