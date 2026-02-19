
import { Link } from 'react-router-dom';
import { ArrowLeft, Ghost } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-primary px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-md"
            >
                <Ghost className="w-16 h-16 text-muted mx-auto mb-6" />
                <h1 className="text-6xl font-bold mb-4">404</h1>
                <p className="text-xl text-muted mb-8">
                    This minion doesn't exist… yet.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
            </motion.div>
        </div>
    );
}
