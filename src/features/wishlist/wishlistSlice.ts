import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { loadFromStorage, STORAGE_KEYS } from '@/utils/storage';

const initialState: { ids: string[] } = { ids: loadFromStorage<string[]>(STORAGE_KEYS.wishlist) ?? [] };

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist(state, action: PayloadAction<string>) {
      state.ids = state.ids.includes(action.payload)
        ? state.ids.filter((id) => id !== action.payload)
        : [...state.ids, action.payload];
    },
  },
});

export const { toggleWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
