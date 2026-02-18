
import { usePlayground } from '../../hooks/usePlayground';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function ValidationPanel() {
    const { state } = usePlayground();
    const result = state.validationResult;

    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full text-muted">
                <p>Start editing to validate</p>
            </div>
        );
    }

    if (result.valid) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success mb-4">
                    <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-success mb-2">Valid Minion</h3>
                <p className="text-sm text-muted">
                    All fields match the schema requirements.
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 h-full animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center space-x-2 text-error mb-6">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold">Validation Errors</h3>
            </div>

            <ul className="space-y-3">
                {result.errors.map((err, i) => (
                    <li key={i} className="p-3 rounded-lg bg-error/10 border border-error/20 flex flex-col">
                        <span className="text-xs font-mono text-error/80 uppercase mb-1">{err.field}</span>
                        <span className="text-sm text-error font-medium">{err.message}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
