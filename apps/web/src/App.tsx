
import { Outlet } from 'react-router-dom';

function App() {
    return (
        <div className="min-h-screen bg-background text-primary font-sans">
            <Outlet />
        </div>
    );
}

export default App;
