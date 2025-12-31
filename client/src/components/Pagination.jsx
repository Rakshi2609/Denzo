import React from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Pagination = ({ page, pageSize, total, onPageChange }) => {
    const totalPages = Math.ceil(total / pageSize);

    if (totalPages <= 1) return null;

    const handlePrevious = () => {
        if (page > 1) onPageChange(page - 1);
    };

    const handleNext = () => {
        if (page < totalPages) onPageChange(page + 1);
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <motion.button
                onClick={handlePrevious}
                disabled={page === 1}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 ${
                    page === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
                }`}
                whileHover={page !== 1 ? { scale: 1.05 } : {}}
                whileTap={page !== 1 ? { scale: 0.95 } : {}}
            >
                <FaChevronLeft className="text-sm" />
                <span className="hidden sm:inline">Previous</span>
            </motion.button>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                    Page {page} of {totalPages}
                </span>
                <span className="text-xs text-gray-500">
                    ({total} total)
                </span>
            </div>

            <motion.button
                onClick={handleNext}
                disabled={page === totalPages}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 ${
                    page === totalPages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
                }`}
                whileHover={page !== totalPages ? { scale: 1.05 } : {}}
                whileTap={page !== totalPages ? { scale: 0.95 } : {}}
            >
                <span className="hidden sm:inline">Next</span>
                <FaChevronRight className="text-sm" />
            </motion.button>
        </div>
    );
};

export default Pagination;
