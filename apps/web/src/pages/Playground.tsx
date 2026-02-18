
import { PlaygroundProvider } from '../hooks/usePlayground';
import PlaygroundLayout from '../components/playground/PlaygroundLayout';

export default function Playground() {
    return (
        <PlaygroundProvider>
            <PlaygroundLayout />
        </PlaygroundProvider>
    );
}
