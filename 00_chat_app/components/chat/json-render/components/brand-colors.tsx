"use client";

import { createContext, useContext } from "react";

interface BrandColors {
  primaryColor?: string;
  secondaryColor?: string;
}

const BrandColorsContext = createContext<BrandColors>({});

export const BrandColorsProvider = BrandColorsContext.Provider;
export const useBrandColors = () => useContext(BrandColorsContext);
