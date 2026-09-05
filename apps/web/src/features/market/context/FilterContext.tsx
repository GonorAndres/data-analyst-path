'use client'
import { createContext, useContext, useState } from 'react'

type RoomType = 'All' | 'Entire home/apt' | 'Private room' | 'Shared room' | 'Hotel room'

interface FilterContextValue {
  roomType: RoomType
  setRoomType: (rt: RoomType) => void
}

const FilterContext = createContext<FilterContextValue>({
  roomType: 'All',
  setRoomType: () => {},
})

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [roomType, setRoomType] = useState<RoomType>('All')
  return (
    <FilterContext.Provider value={{ roomType, setRoomType }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  return useContext(FilterContext)
}
