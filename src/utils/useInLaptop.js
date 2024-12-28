import { useState, useEffect } from "react";

const useIsLaptop = () => {
    const [isLaptop, setIsLaptop] = useState(window.innerWidth > 768); // 768px is a common breakpoint

    useEffect(() => {
        const handleResize = () => setIsLaptop(window.innerWidth > 768);
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isLaptop;
};

export default useIsLaptop;
