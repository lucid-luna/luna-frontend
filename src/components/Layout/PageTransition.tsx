// ====================================================================
// L.U.N.A. Page Transition Component
// ====================================================================

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

const PageTransition = ({ children }: Props) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
        style={{ width: '100%', height: '100%' }}
    >
        {children}
    </motion.div>
);

export default PageTransition;
