import { createContext, useContext, useMemo, useState } from "react";

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
    const [progressData, setProgressData] = useState(null);

    const value = useMemo(
        () => ({
            progressData,
            setProgressData,
        }),
        [progressData]
    );

    return (
        <ProgressContext.Provider value={value}>
            {children}
        </ProgressContext.Provider>
    );
}

export function useProgress() {
    const context = useContext(ProgressContext);

    if (!context) {
        throw new Error("useProgress must be used inside ProgressProvider");
    }

    return context;
}