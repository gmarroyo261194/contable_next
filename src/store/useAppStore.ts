import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  empresaId: number | null
  ejercicioId: number | null
  setEmpresa: (id: number | null) => void
  setEjercicio: (id: number | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      empresaId: null,
      ejercicioId: null,
      setEmpresa: (id) => set({ empresaId: id, ejercicioId: null }), // Reset exercise when company changes
      setEjercicio: (id) => set({ ejercicioId: id }),
    }),
    {
      name: 'contable-storage',
    }
  )
)
