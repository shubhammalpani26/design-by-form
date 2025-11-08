import { createContext, useContext, useState, ReactNode } from 'react';

interface ComparisonContextType {
  comparisonList: string[];
  addToComparison: (id: string) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
  isInComparison: (id: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within ComparisonProvider');
  }
  return context;
};

export const ComparisonProvider = ({ children }: { children: ReactNode }) => {
  const [comparisonList, setComparisonList] = useState<string[]>([]);

  const addToComparison = (id: string) => {
    if (comparisonList.length >= 4) {
      return; // Max 4 products
    }
    if (!comparisonList.includes(id)) {
      setComparisonList([...comparisonList, id]);
    }
  };

  const removeFromComparison = (id: string) => {
    setComparisonList(comparisonList.filter(productId => productId !== id));
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  const isInComparison = (id: string) => {
    return comparisonList.includes(id);
  };

  return (
    <ComparisonContext.Provider
      value={{
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};
