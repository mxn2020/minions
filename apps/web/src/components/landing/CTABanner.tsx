
import { Link } from 'react-router-dom';
import { Button } from '../shared/Button';

export default function CTABanner() {
    return (
        <section className="py-32 border-t border-border bg-gradient-to-b from-background to-accent/5">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-10">
                    Ready to give your agents a home?
                </h2>
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <Link to="/playground">
                        <Button size="lg" className="min-w-[200px]">Open Playground →</Button>
                    </Link>
                    <a href="https://github.com/mxn2020/minions" target="_blank" rel="noreferrer">
                        <Button size="lg" variant="secondary" className="min-w-[200px]">View on GitHub</Button>
                    </a>
                </div>
            </div>
        </section>
    );
}
