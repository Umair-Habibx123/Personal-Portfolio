import React from "react";
import { motion } from "framer-motion";

const Popup = ({ isOpen, message, type, onClose }) => {
    if (!isOpen) return null;

    const backgroundColor = type === "success" ? "bg-green-500" : "bg-red-500";

    return (
        <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div
                className={`p-6 rounded-lg shadow-lg ${backgroundColor} text-white max-w-sm text-center`}
            >
                <p className="font-medium">{message}</p>
                <button
                    className="mt-4 bg-white text-black py-2 px-4 rounded-lg font-bold hover:bg-gray-200"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </motion.div>
    );
};

export default Popup;
