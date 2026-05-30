import { createContext, useContext, useMemo, useState } from "react";

const HintContext = createContext(null);

export function HintProvider({ children }) {
    const [hintData, setHintData] = useState(null);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);

    const value = useMemo(
        () => ({
            hintData,
            setHintData,
            cooldownRemaining,
            setCooldownRemaining,
        }),
        [hintData, cooldownRemaining]
    );

    return (
        <HintContext.Provider value={value}>
            {children}
        </HintContext.Provider>
    );
}

export function useHint() {
    const context = useContext(HintContext);

    if (!context) {
        throw new Error("useHint must be used inside HintProvider");
    }

    return context;
}